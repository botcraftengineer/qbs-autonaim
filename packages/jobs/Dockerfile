FROM oven/bun:1.3.3-alpine AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lock turbo.json ./
COPY packages/config/package.json ./packages/airbconfigyte/
COPY packages/jobs/package.json ./packages/jobs/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/telegram-bot/package.json ./packages/telegram-bot/
COPY tooling/typescript/package.json ./tooling/typescript/

RUN bun install

FROM base AS builder
COPY package.json bun.lock turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/jobs/package.json ./packages/jobs/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/telegram-bot/package.json ./packages/telegram-bot/
COPY tooling/typescript/package.json ./tooling/typescript/


RUN bun install

COPY packages/jobs ./packages/jobs
COPY packages/config ./packages/config
COPY packages/db ./packages/db
COPY packages/lib ./packages/lib
COPY packages/telegram-bot ./packages/telegram-bot
COPY tooling/typescript ./tooling/typescript

RUN bun run build

FROM oven/bun:1.3.3-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser

COPY --from=deps --chown=bunuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:nodejs /app/packages ./packages
COPY --from=builder --chown=bunuser:nodejs /app/tooling ./tooling
COPY --from=builder --chown=bunuser:nodejs /app/package.json ./package.json

ENV NODE_ENV=production \
    PORT=8000

USER bunuser

EXPOSE 8000


CMD ["bun", "run", "/app/packages/jobs/src/inngest/server.ts"]
