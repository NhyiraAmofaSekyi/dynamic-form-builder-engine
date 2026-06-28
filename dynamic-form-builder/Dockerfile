# syntax=docker/dockerfile:1
# Frontend = TanStack Start in SPA mode (spa.enabled in vite.config). The build
# emits a static client bundle to dist/client, which nginx serves. No Node at
# runtime.

# ---- build stage ----------------------------------------------------------
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# VITE_* baked into the client bundle at build time.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm run build

# ---- runtime stage --------------------------------------------------------
FROM nginx:1.27-alpine

# Remove nginx's stock html ("Welcome to nginx" index.html + 50x.html) so its
# default index.html can never shadow our app. THIS is what fixes the welcome
# page — COPY adds files alongside the defaults, it doesn't replace them.
RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

# SPA mode outputs the static site to dist/client (NOT dist/). Serve that.
COPY --from=build /app/dist/client /usr/share/nginx/html

# SPA mode emits the shell as _shell.html, but nginx serves index.html for "/"
# by default. Promote the shell to index.html so the root serves the app.
RUN cp /usr/share/nginx/html/_shell.html /usr/share/nginx/html/index.html

EXPOSE 80