# Pagination Module

A reusable, generic pagination utility shared across all feature modules in the application.
It lives under `src/common/pagination/` and is imported wherever a list endpoint needs paging.

---

## Folder Structure

```
src/common/pagination/
├── dtos/
│   └── pagination-query.dto.ts      # Query-string contract (limit, page)
├── interfaces/
│   └── paginated.interface.ts       # Shape of every paginated response
├── providers/
│   └── pagination.provider.ts       # Generic database query + link builder
└── pagination.module.ts             # NestJS module that wires and exports the provider
```

---

## Files Explained

### `dtos/pagination-query.dto.ts`

Defines the two query-string parameters accepted by any paginated endpoint:

| Field   | Type   | Default | Constraint        |
|---------|--------|---------|-------------------|
| `limit` | number | 10      | integer, min 1    |
| `page`  | number | 1       | integer, min 1    |

Both fields are optional. `@Type(() => Number)` (class-transformer) coerces the raw string
from the URL (`?limit=5&page=2`) into a real number before `class-validator` checks it.
`@ApiPropertyOptional` makes both fields appear in the Swagger UI with sensible defaults.

Usage in a controller:

```ts
@Get()
findAll(@Query() paginationQuery: PaginationQueryDto) { ... }
```

---

### `interfaces/paginated.interface.ts`

Three TypeScript interfaces that describe every paginated API response:

#### `PaginationMeta`
```ts
{
  itemsPerPage: number;   // size of each page (= limit)
  totalItems:   number;   // total rows in DB matching the query
  currentPage:  number;   // the requested page number
  totalPages:   number;   // Math.ceil(totalItems / limit)
}
```

#### `PaginationLinks`
```ts
{
  first:    string;  // page=1
  last:     string;  // page=totalPages
  current:  string;  // page=currentPage
  next:     string;  // page=min(currentPage+1, totalPages)
  previous: string;  // page=max(currentPage-1, 1)
}
```
Links are absolute URLs built from the incoming request (`protocol + host + path`),
so clients can navigate pages without constructing URLs themselves.

#### `Paginated<T>` (generic)
```ts
{
  data:  T[];              // the actual rows for this page
  meta:  PaginationMeta;
  links: PaginationLinks;
}
```
`T` is the entity type (e.g., `Post`). Every paginated endpoint in the app returns
a value that satisfies `Paginated<Entity>`.

---

### `providers/pagination.provider.ts`

The single injectable service that does all the work.

```ts
async paginateQuery<T extends ObjectLiteral>(
  paginationQuery: PaginationQueryDto,
  repository:     Repository<T>,
  request:        Request,
  findOptions?:   Omit<FindManyOptions<T>, 'skip' | 'take'>,
): Promise<Paginated<T>>
```

#### What it does — step by step

1. **Extracts `limit` and `page`** from the DTO (falls back to defaults if undefined).
2. **Calls `repository.findAndCount()`** — a single TypeORM query that returns both
   the current page's rows and the total matching row count.
   - `skip = (page - 1) * limit` translates the 1-based page number to a SQL OFFSET.
   - `take = limit` becomes the SQL LIMIT.
   - Any caller-supplied `findOptions` (relations, where clauses, order, etc.) are
     spread in first, then `skip`/`take` overwrite them so callers can never
     accidentally bypass pagination.
3. **Builds `totalPages`** — `Math.ceil(totalItems / limit) || 1` ensures at least 1
   page is reported even when the table is empty.
4. **Builds the five navigation links** using `request.protocol`, `request.get('host')`,
   and `request.path` so the links are environment-aware (localhost vs. production).
5. **Returns** the assembled `Paginated<T>` object.

If the DB query throws, an `InternalServerErrorException` is raised (the original DB
error is swallowed to avoid leaking schema details to clients).

#### Why `Omit<FindManyOptions<T>, 'skip' | 'take'>`?

Callers pass filtering/sorting options (`where`, `relations`, `order`) but are prevented
from injecting their own `skip`/`take` — pagination math is always centralised here.

---

### `pagination.module.ts`

```ts
@Module({
  providers: [PaginationProvider],
  exports:   [PaginationProvider],
})
export class PaginationModule {}
```

A thin wrapper that registers `PaginationProvider` and re-exports it.
Any feature module that needs pagination imports `PaginationModule` and immediately
gets `PaginationProvider` available for injection — no extra registration needed.

---

## How the Module Is Consumed (example: Posts)

```
PostsModule
  imports: [PaginationModule]          ← makes PaginationProvider injectable

PostsService
  constructor(private paginationProvider: PaginationProvider)

  findAll(paginationQuery, request) {
    return this.paginationProvider.paginateQuery(
      paginationQuery,
      this.postsRepository,
      request,
      { relations: { metaOptions: true, author: true, tags: true } },
    );
  }

PostsController
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto, @Req() request: Request)
```

The controller binds the query string to `PaginationQueryDto`, passes it together with
the raw Express `Request` object down to the service, which delegates entirely to
`PaginationProvider`.

---

## Data-Flow Diagram

```
HTTP GET /posts?limit=5&page=2
        │
        ▼
PostsController.findAll()
  @Query() PaginationQueryDto  ──► { limit: 5, page: 2 }
  @Req()   Request             ──► http://localhost:3000/posts
        │
        ▼
PostsService.findAll()
        │
        ▼
PaginationProvider.paginateQuery()
  repository.findAndCount({ skip: 5, take: 5, ...findOptions })
        │
        ▼
PostgreSQL  →  [rows], totalItems
        │
        ▼
Paginated<Post> {
  data:  [ Post, Post, Post, Post, Post ],
  meta:  { itemsPerPage:5, totalItems:42, currentPage:2, totalPages:9 },
  links: { first, last, current, next, previous }
}
        │
        ▼
HTTP 200 JSON response
```

---

## Adding Pagination to a New Module

1. Import `PaginationModule` in your feature module.
2. Inject `PaginationProvider` in your service.
3. Accept `PaginationQueryDto` via `@Query()` and `Request` via `@Req()` in your controller.
4. Call `paginationProvider.paginateQuery(query, repo, request, findOptions?)`.

No other setup is required.