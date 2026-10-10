FROM oven/bun:1.4.3 AS bun

FROM node:22-bookworm-slim AS base
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build bun run db:generate
RUN bun run build

FROM base AS production-dependencies
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile --ignore-scripts

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/generated ./generated
COPY --chown=node:node package.json ./
RUN mkdir -p .data && chown node:node .data
USER node
EXPOSE 8080
CMD ["node", "dist/server/entry.mjs"]
