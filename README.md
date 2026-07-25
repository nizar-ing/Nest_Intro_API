# Nest_Intro_API

A NestJS blog REST API with PostgreSQL persistence, request validation, pagination and auto-generated OpenAPI docs.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pg%208-4169E1?logo=postgresql&logoColor=white)

## Overview

A learning-oriented NestJS backend for a blog application. It models the core
domain of a blogging platform — users, posts, tags and per-post meta options —
and wires up the infrastructure a real API needs:

- **TypeORM + PostgreSQL** for persistence, configured asynchronously from environment variables.
- **Startup config validation** via Joi, so the app fails fast with a clear message when a required variable is missing rather than crashing later at query time.
- **A global `ValidationPipe`** (`whitelist`, `forbidNonWhitelisted`, `transform`) that strips unknown fields, rejects unexpected ones with a 400, and coerces payloads into typed DTO instances.
- **A global exception filter** that normalises `HttpException` subclasses and TypeORM `QueryFailedError` into a single `{ statusCode, timestamp, path, message }` envelope.
- **A reusable pagination provider** that returns `data`, `meta` and navigation `links` for any entity.
- **Swagger/OpenAPI** generated from the DTO decorators and served with the app.

## Requirements

- Node.js 20+ (the project builds against `@types/node` 22)
- A running PostgreSQL instance
- npm

## Installation

```bash
git clone https://github.com/nizar-ing/Nest_Intro_API.git
cd Nest_Intro_API
npm install
```

Create a `.env` file at the project root (see [Configuration](#configuration)),
then start the API in watch mode:

```bash
npm run start:dev
```

The server listens on `APP_PORT` (default `3000`).

## Usage

Once running, Swagger UI is available at <http://localhost:3000/api> and the raw
OpenAPI document at <http://localhost:3000/api-json>.

Create a post:

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "What is new with NestJS",
    "postType": "post",
    "slug": "new-with-nestjs-10",
    "status": "draft",
    "content": "Test Content",
    "featuredImageUrl": "http://localhost.com/images/image1.jpg",
    "publishOn": "2026-02-25T10:46:32+0000",
    "metaOptions": { "metaValue": "{\"sidebarEnabled\": true}" },
    "authorId": 1,
    "tags": [1, 4]
  }'
```

Fetch a paginated list of posts:

```bash
curl "http://localhost:3000/posts?limit=10&page=1"
```

which responds with the shape defined by the `Paginated<T>` interface:

```json
{
  "data": [],
  "meta": {
    "itemsPerPage": 10,
    "totalItems": 0,
    "currentPage": 1,
    "totalPages": 0
  },
  "links": {
    "first": "...",
    "last": "...",
    "current": "...",
    "next": "...",
    "previous": "..."
  }
}
```

### Available endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/posts?limit&page` | Paginated list of posts |
| `POST` | `/posts` | Create a post |
| `PATCH` | `/posts` | Update a post (id in the body) |
| `DELETE` | `/posts?id=` | Delete a post and its meta options |
| `GET` | `/users?limit&page` | List users |
| `GET` | `/users/:id` | Fetch a single user |
| `POST` | `/users` | Create a user |
| `POST` | `/users/create-many` | Create several users in one transaction |
| `POST` | `/tags` | Create a tag |
| `DELETE` | `/tags?id=` | Hard-delete a tag |
| `DELETE` | `/tags/soft-delete?id=` | Soft-delete a tag |
| `POST` | `/meta-options` | Create post meta options |

> Note: `PATCH /users/:id` exists in the source but is currently commented out,
> and the `auth` module exposes a controller with no routes yet.

Ready-to-run request samples live alongside each module in `*.http` files
(`src/posts/http/`, `src/users/http/`, `src/tags/http/`, …) and can be executed
directly from JetBrains IDEs or the VS Code REST Client extension.

## Configuration

Configuration is loaded by `@nestjs/config` from `.env.${NODE_ENV}` then `.env`,
and validated at boot with Joi. `.env` files are gitignored.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | One of `development`, `production`, `test` |
| `APP_PORT` | no | `3000` | Port the HTTP server binds to |
| `DATABASE_HOST` | **yes** | — | PostgreSQL host |
| `DATABASE_PORT` | no | `5432` | PostgreSQL port |
| `DATABASE_USER` | **yes** | — | PostgreSQL user |
| `DATABASE_PASSWORD` | **yes** | — | PostgreSQL password |
| `DATABASE_NAME` | **yes** | — | Database name |
| `DATABASE_SYNC` | no | `false` | `'true'` enables TypeORM schema synchronisation — development only |

Example `.env`:

```dotenv
NODE_ENV=development
APP_PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nestjs_blog
DATABASE_SYNC=true
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the app |
| `npm run start:dev` | Start in watch mode |
| `npm run start:debug` | Start in watch + debug mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build (`node dist/main`) |
| `npm test` | Run unit tests (Jest, `*.spec.ts` under `src/`) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests (`test/jest-e2e.json`) |
| `npm run lint` | ESLint with `--fix` |
| `npm run format` | Prettier over `src/` and `test/` |
| `npm run doc` | Generate and serve Compodoc docs on port 3003 |

## Project structure

```
src/
├── main.ts                  # Bootstrap: global pipes, exception filter, Swagger
├── app.module.ts            # Root module: config validation + TypeORM wiring
├── config/                  # registerAs() namespaces: app.*, database.*
├── common/
│   ├── filters/             # Global HTTP exception filter
│   └── pagination/          # Reusable pagination provider, DTO and interfaces
├── users/                   # User entity, controller, DTOs, providers
├── posts/                   # Post entity, controller, DTOs, status/type enums
├── tags/                    # Tag entity, controller, DTOs
├── meta-options/            # Per-post meta options
└── auth/                    # Auth module (scaffolded)
test/                        # End-to-end tests
```

Each feature folder also ships an `http/` directory of executable request samples.
Pagination internals are documented in `src/common/pagination/PAGINATION.md`.

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```bash
npm run lint
npm run format
npm test
```

## License

Declared as `UNLICENSED` in `package.json`; no `LICENSE` file is present in the repository.
