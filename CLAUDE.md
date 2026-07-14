# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # watch mode (recommended for development)
npm run start:debug     # debug + watch mode

# Build & production
npm run build
npm run start:prod

# Testing
npm run test            # unit tests (Jest, files matching *.spec.ts under src/)
npm run test:watch      # watch mode
npm run test:cov        # with coverage
npm run test:e2e        # e2e tests (config: test/jest-e2e.json)

# Single test file
npx jest src/app.controller.spec.ts

# Code quality
npm run lint            # ESLint with auto-fix
npm run format          # Prettier

# API docs (Compodoc)
npm run doc             # serves at http://localhost:3003
```

## Environment

The app requires a `.env` file (or `.env.development` / `.env.test` for environment-specific overrides — the environment-specific file takes precedence). Required variables validated at startup by Joi:

```
NODE_ENV=development          # development | production | test
APP_PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<password>
DATABASE_NAME=nestjs-blog
DATABASE_SYNC=true            # set false in production
```

Config values are accessed via namespaced keys (`app.port`, `database.host`, `database.synchronize`, etc.) from the `registerAs` factories in `src/config/`.

## Architecture

This is a NestJS 11 blog API backed by PostgreSQL via TypeORM. The app runs on port 3000. Swagger UI is at `/api`; raw OpenAPI JSON is at `/api-json`.

**Database:** PostgreSQL, schema controlled by `DATABASE_SYNC` env var (`synchronize: true` auto-migrates on startup; disable in production). `autoLoadEntities: true` is set — any entity registered via `TypeOrmModule.forFeature([Entity])` in a feature module is picked up automatically without listing it in `TypeOrmModule.forRootAsync`.

**Module structure** — each domain follows the same layout:
```
src/<domain>/
  <domain>.module.ts
  <domain>.controller.ts
  <domain>.entity.ts          # TypeORM entity
  providers/<domain>.service.ts
  dtos/                       # class-validator + class-transformer DTOs
  http/                       # .http files for manual API testing
  enums/                      # (posts only)
```

**Domains:**
- `users` — User entity; exports `UsersService` for cross-module use. All read/write operations hit the DB: `findAll()` paginates via skip/take, `findOneById()` throws `NotFoundException`, `createUser()` guards against duplicate emails with `ConflictException`. Bulk creation (`POST /users/create-many`) is handled by `UsersCreateManyProvider` using an explicit `QueryRunner` transaction. The PATCH endpoint is currently commented out.
- `posts` — Post entity; depends on UsersModule and TagsModule; owns the MetaOption repository even though MetaOption has its own module (needed for manual orphan deletion).
- `tags` — Tag entity with soft-delete via `@DeleteDateColumn`. Use `tagsRepository.softDelete(id)` / `.restore(id)`; TypeORM automatically filters out soft-deleted rows in normal queries.
- `meta-options` — MetaOption entity with a OneToOne → Post relationship; cascade-deleted manually in `PostsService.delete()` because TypeORM's OneToOne cascade does not propagate DELETE from Post → MetaOption.
- `auth` — placeholder auth module/service; circular dependency with UsersModule resolved via `forwardRef`.

**Entity relationships:**
- `User` →(OneToMany)→ `Post` (author)
- `Post` →(OneToOne, cascade+eager)→ `MetaOption`
- `Post` ↔(ManyToMany, JoinTable on posts side)↔ `Tag`

**Global validation:** `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — DTOs use class-validator decorators and are the sole source of input validation.

**Global exception filter:** `src/common/filters/http-exception.filter.ts` catches every unhandled exception and normalises the response to `{ statusCode, timestamp, path, message }`. PostgreSQL SQLSTATE codes are mapped to HTTP statuses (23505 unique → 409, 23503 FK → 400, 23502 not-null → 400) without leaking column or table names. `ValidationPipe` `string[]` messages are joined with `; ` before being returned.

**Transaction pattern:** Complex write operations are extracted into dedicated providers (e.g. `UsersCreateManyProvider`) that inject `DataSource` and manage a `QueryRunner` explicitly (connect → startTransaction → commit/rollback → release). Do not inline transaction logic in `UsersService`.

**Swagger:** Every DTO property should carry `@ApiProperty` / `@ApiPropertyOptional` decorators to appear in the generated spec.