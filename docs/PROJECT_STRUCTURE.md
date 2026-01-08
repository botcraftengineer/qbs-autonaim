# Project Structure

## Monorepo Overview

```
.
├── apps/                    # Applications
│   ├── app/                # Main application (dashboard, admin)
│   ├── interview/          # Interview service (public, isolated)
│   ├── ai-proxy/           # AI proxy service
│   ├── playwright/         # E2E tests
│   └── web/                # Marketing website
│
├── packages/               # Shared packages
│   ├── api/                # tRPC API router
│   ├── auth/               # Authentication (Better Auth)
│   ├── config/             # Shared configuration
│   ├── db/                 # Database schema (Drizzle)
│   ├── interview-ui/       # Interview UI components
│   ├── jobs/               # Background jobs (Inngest)
│   ├── lib/                # Shared utilities
│   ├── shared/             # Shared types & utils
│   ├── tg-client/          # Telegram client
│   ├── ui/                 # UI components (shadcn/ui)
│   └── validators/         # Zod schemas
│
├── tooling/                # Development tools
│   └── tailwind-config/    # Tailwind configuration
│
├── docs/                   # Documentation
└── external/               # External integrations
```

## Applications

### apps/app
**Main Application** - Dashboard, admin panel, vacancy management

- **URL**: `https://domain.ru`
- **Port**: 3000
- **Auth**: Required (Better Auth)
- **Features**:
  - Vacancy management
  - Candidate pipeline
  - AI screening
  - Analytics
  - Settings

### apps/interview
**Interview Service** - Public AI interview platform

- **URL**: `https://interview.domain.ru`
- **Port**: 3001
- **Auth**: None (token-based)
- **Features**:
  - Clean URL (`/[token]`)
  - AI chat with streaming
  - Voice messages
  - Mobile-optimized

### apps/ai-proxy
**AI Proxy** - Proxy for AI requests

- **Port**: 3002
- **Features**:
  - Rate limiting
  - Caching
  - Load balancing

### apps/web
**Marketing Website** - Public website

- **URL**: `https://domain.ru` (or separate domain)
- **Features**:
  - Landing pages
  - Blog
  - Documentation

## Packages

### Core Packages

#### @qbs-autonaim/api
tRPC API router with all procedures

```typescript
import { appRouter } from "@qbs-autonaim/api";
```

#### @qbs-autonaim/db
Database schema and client (Drizzle ORM)

```typescript
import { db, eq } from "@qbs-autonaim/db";
import { user } from "@qbs-autonaim/db/schema";
```

#### @qbs-autonaim/auth
Authentication (Better Auth)

```typescript
import { auth } from "@qbs-autonaim/auth";
```

### UI Packages

#### @qbs-autonaim/ui
Base UI components (shadcn/ui)

```typescript
import { Button, Card } from "@qbs-autonaim/ui";
```

#### @qbs-autonaim/interview-ui
Interview-specific UI components

```typescript
import { InterviewLandingForm } from "@qbs-autonaim/interview-ui";
```

### Utility Packages

#### @qbs-autonaim/config
Shared configuration (routes, constants)

```typescript
import { paths, APP_CONFIG } from "@qbs-autonaim/config";
```

#### @qbs-autonaim/lib
Shared utilities (AI, S3, etc.)

```typescript
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { uploadFile } from "@qbs-autonaim/lib/s3";
```

#### @qbs-autonaim/validators
Zod validation schemas

```typescript
import { userSchema } from "@qbs-autonaim/validators";
```

### Background Jobs

#### @qbs-autonaim/jobs
Inngest functions for background processing

```typescript
import { inngest } from "@qbs-autonaim/jobs/client";
```

### Integrations

#### @qbs-autonaim/tg-client
Telegram client for messaging

```typescript
import { sendMessage } from "@qbs-autonaim/tg-client";
```

## Development

### Running Applications

```bash
# All apps
bun run dev

# Specific app
bun run dev:app              # Main app (3000)
bun run dev --filter=@qbs-autonaim/interview  # Interview (3001)

# Multiple apps
bun run dev:all              # Telegram + Jobs
```

### Building

```bash
# All packages
bun run build

# Specific package
bun run build --filter=@qbs-autonaim/interview
```

### Database

```bash
# Push schema changes
bun run db:push

# Open Drizzle Studio
bun run db:studio

# Generate encryption key
bun run db:generate-key

# Migrate workspaces
bun run db:migrate-workspaces
```

### Code Quality

```bash
# Format
bun run format
bun run format:fix

# Lint
bun run lint
bun run lint:fix

# Check (format + lint)
bun run check
bun run check:fix

# Type check
bun run typecheck

# Workspace lint
bun run lint:ws
```

## Package Dependencies

### Dependency Graph

```
apps/app
├── @qbs-autonaim/api
├── @qbs-autonaim/auth
├── @qbs-autonaim/db
├── @qbs-autonaim/ui
└── @qbs-autonaim/validators

apps/interview
├── @qbs-autonaim/api
├── @qbs-autonaim/config
├── @qbs-autonaim/db
├── @qbs-autonaim/interview-ui
└── @qbs-autonaim/ui

packages/interview-ui
├── @qbs-autonaim/config
└── @qbs-autonaim/ui

packages/api
├── @qbs-autonaim/auth
├── @qbs-autonaim/db
├── @qbs-autonaim/jobs
└── @qbs-autonaim/validators
```

## Deployment

### Vercel

Each app can be deployed separately:

```yaml
# apps/app
Root Directory: apps/app
Framework: Next.js
Domain: domain.ru

# apps/interview
Root Directory: apps/interview
Framework: Next.js
Domain: interview.domain.ru
```

### Docker

```bash
# Build specific app
docker build -f apps/interview/Dockerfile -t interview-service .

# Run
docker run -p 3001:3001 interview-service
```

## Environment Variables

### Shared (all apps)

```env
# Database
POSTGRES_URL=postgresql://...

# AI
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-...

# S3
AWS_S3_ENDPOINT=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
AWS_S3_BUCKET=...
```

### App-specific

```env
# apps/app
NEXT_PUBLIC_APP_URL=https://domain.ru
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# apps/interview
NEXT_PUBLIC_APP_URL=https://interview.domain.ru
```

## Adding New Packages

```bash
# Create package
mkdir -p packages/my-package/src
cd packages/my-package

# Initialize
bun init

# Add to workspace
# Edit package.json:
{
  "name": "@qbs-autonaim/my-package",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  }
}

# Install in app
cd ../../apps/app
bun add @qbs-autonaim/my-package@workspace:*
```

## Best Practices

1. **Shared code** → packages/
2. **App-specific code** → apps/[app]/src/
3. **UI components** → packages/ui/ or packages/interview-ui/
4. **Types** → packages/shared/ or co-located
5. **Utilities** → packages/lib/
6. **Validation** → packages/validators/

## Documentation

- `apps/interview/README.md` - Interview service
- `packages/interview-ui/README.md` - Interview UI components
- `MIGRATION_GUIDE.md` - Migration guide
- `docs/INTERVIEW_SERVICE_ARCHITECTURE.md` - Architecture
- `INTERVIEW_SERVICE_SUMMARY.md` - Quick summary
