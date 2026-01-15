FROM oven/bun:1.3.6-alpine AS base

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN bun install
RUN bunx turbo build --filter=@qbs-autonaim/jobs

FROM base AS installer
WORKDIR /app

# Copy built files
COPY --from=builder /app .

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

COPY --from=builder /app .

CMD ["bun", "run", "packages/jobs/src/inngest/server.ts"]

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
