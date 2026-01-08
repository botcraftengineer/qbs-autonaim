FROM oven/bun:1.3.5 AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/interview/package.json ./apps/interview/
COPY packages/interview-ui/package.json ./packages/interview-ui/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validators/package.json ./packages/validators/
COPY packages/tailwind-config/package.json ./packages/tailwind-config/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun run build --filter=@qbs-autonaim/interview

# Production
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/interview/.next/standalone ./
COPY --from=builder /app/apps/interview/.next/static ./apps/interview/.next/static
COPY --from=builder /app/apps/interview/public ./apps/interview/public

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "apps/interview/server.js"]
