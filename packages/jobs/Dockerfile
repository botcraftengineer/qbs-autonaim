FROM oven/bun:1.3.6-alpine AS base

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
RUN bun add -g turbo

# Copy only necessary files for pruning
COPY package.json bun.lock turbo.json ./
COPY packages/jobs/package.json ./packages/jobs/
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

RUN turbo prune @qbs-autonaim/jobs --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN bun install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN bunx turbo build --filter=@qbs-autonaim/jobs

FROM base AS runner
WORKDIR /app

# Install system dependencies including Chromium for Puppeteer
RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set environment variables
ENV NODE_ENV=production \
    PORT=8000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Don't run production as root
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs

# Создаем директорию для MTCute с правами для bunjs
RUN mkdir -p /tmp/mtcute && chown -R bunjs:bunjs /tmp/mtcute

USER bunjs

COPY --from=installer /app .

CMD ["bun", "run", "packages/jobs/src/inngest/server.ts"]
