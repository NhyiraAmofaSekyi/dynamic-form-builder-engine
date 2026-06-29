# Running locally

## 1. Create your env file

Copy `example-vars` to `.env` and fill in the values:

cp example-vars .env

At minimum set `SEED_TEST_PASSWORD` if you want a seeded test account created
(omit it and no test account is made).

## 2. Build and run

docker compose -f compose.local.yaml up --build

This builds and starts the database, API, and frontend containers.

## 3. Open the app

- Frontend: http://localhost:3000
- API: http://localhost:8080 (Swagger at /swagger, docs at /docs)

A seeded test account is created only if `SEED_TEST_PASSWORD` is set in `.env`.

## Changing ports (optional)

All ports default to the values above. To override, set these in `.env`:

| Variable            | Default                      | Notes                                                            |
| ------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `WEB_PORT`          | 3000                         | Frontend port. If changed, add the new origin to `CORS_ORIGINS`. |
| `API_PORT`          | 8080                         | API port. If changed, also update `VITE_API_BASE_URL` to match.  |
| `VITE_API_BASE_URL` | http://localhost:8080/api/v1 | Baked into the frontend at build time — rebuild after changing.  |
| `CORS_ORIGINS`      | http://localhost:3000        | Comma-separated origins the API accepts.                         |

Because `VITE_API_BASE_URL` is compiled into the frontend bundle, any change to
the API port or URL requires a rebuild:

docker compose -f compose.local.yaml up --build
