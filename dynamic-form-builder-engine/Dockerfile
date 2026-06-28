# syntax=docker/dockerfile:1

# ---- build stage ----------------------------------------------------------
FROM golang:1.25-alpine AS build

RUN apk add --no-cache git ca-certificates

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Static binary. main.go is at the repo root, so build target is ".".
# CGO off => fully static => runs on distroless. Migrations are go:embed'd.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api .

# ---- runtime stage --------------------------------------------------------
# Distroless: no shell, no package manager, runs as non-root. Tiny + secure.
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /out/api /api

EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api"]