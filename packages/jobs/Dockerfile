FROM oven/bun:1.3.3-alpine AS base

# Install dependencies for Puppeteer (Chromium)
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Stage: deps - Install dependencies
FROM base AS deps
COPY package.json bun.lock turbo.json ./
COPY packages/jobs/package.json ./packages/jobs/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install dependencies
RUN bun install

# Stage: builder - Build the project
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the project (this will build config, db, etc.)
ENV CI=true
RUN bun run build --filter=@selectio/jobs...

# Stage: runner - Run the application
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 bunuser

# Copy necessary files
COPY --from=builder --chown=bunuser:bunjs /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:bunjs /app/packages/jobs ./packages/jobs
COPY --from=builder --chown=bunuser:bunjs /app/packages/db ./packages/db
COPY --from=builder --chown=bunuser:bunjs /app/packages/config ./packages/config
COPY --from=builder --chown=bunuser:bunjs /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Switch to non-root user
USER bunuser

# Expose the port
EXPOSE 8000

# Run the Inngest server
CMD ["bun", "run", "packages/jobs/src/inngest/server.ts"]
