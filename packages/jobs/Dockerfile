FROM oven/bun:1.3.6-alpine AS base

# The web Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update this Dockerfile, the Dockerfile in the web workspace and copy that over to Dockerfile in the docs.

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN bun add -g turbo
COPY . .
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
