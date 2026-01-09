# Interview Service

Отдельный Next.js сервис для прохождения AI-интервью с чистым URL.

## Особенности

- **Чистый URL**: `domain.ru/[token]` вместо `domain.ru/interview/[token]`
- **Изолированный сервис**: Независимое развертывание и масштабирование
- **Минимальный бандл**: Только необходимые компоненты для интервью
- **Публичный доступ**: Без авторизации, защита через токены

## Структура

```
apps/interview/
├── src/
│   ├── app/
│   │   ├── [token]/
│   │   │   ├── page.tsx          # Лендинг интервью
│   │   │   ├── chat/
│   │   │   │   └── page.tsx      # Чат интервью
│   │   │   └── not-found.tsx
│   │   ├── api/
│   │   │   ├── trpc/             # tRPC endpoints
│   │   │   └── interview/        # Interview API
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── styles.css
│   ├── components/
│   │   ├── interview-chat.tsx
│   │   ├── interview-context-card.tsx
│   │   └── ai-chat-input.tsx
│   ├── hooks/
│   │   ├── use-voice-recorder.ts
│   │   └── use-scroll-to-bottom.ts
│   ├── trpc/
│   │   ├── react.tsx
│   │   ├── server.tsx
│   │   └── query-client.ts
│   ├── types/
│   │   └── ai-chat.ts
│   └── env.ts
├── package.json
├── next.config.ts
└── tsconfig.json
```

## Разработка

```bash
# Запуск dev сервера (порт 3001)
bun run dev

# Сборка
bun run build

# Запуск production
bun run start
```

## Deployment

### Vercel

1. Создайте новый проект в Vercel
2. Укажите root directory: `apps/interview`
3. Настройте переменные окружения
4. Настройте кастомный домен (например, `interview.domain.ru`)

### Docker

```bash
# Сборка
docker build -f apps/interview/Dockerfile -t interview-service .

# Запуск
docker run -p 3001:3001 interview-service
```

## Переменные окружения

```env
# App
NEXT_PUBLIC_APP_URL=https://interview.domain.ru
NEXT_PUBLIC_APP_NAME=QBS Интервью

# Database (shared with main app)
POSTGRES_URL=...

# AI
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=...

# S3 (для голосовых сообщений)
AWS_S3_ENDPOINT=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...

# Langfuse (опционально)
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_BASE_URL=...
```

## API Endpoints

### Public Endpoints

- `GET /[token]` - Лендинг интервью
- `GET /[token]/chat` - Чат интервью
- `POST /api/interview/chat/stream` - Стриминг AI ответов
- `POST /api/interview/upload-voice` - Загрузка голосовых сообщений
- `POST /api/trpc/[trpc]` - tRPC endpoints

## Shared Packages

- `@qbs-autonaim/interview-ui` - UI компоненты для интервью
- `@qbs-autonaim/api` - tRPC API
- `@qbs-autonaim/db` - Database schema
- `@qbs-autonaim/config` - Shared configuration
- `@qbs-autonaim/ui` - UI components library

## Миграция с apps/app

Старый URL `/interview/[token]` в `apps/app` можно настроить на редирект:

```typescript
// apps/app/src/middleware.ts
if (pathname.startsWith('/interview/')) {
  const token = pathname.split('/')[2];
  return NextResponse.redirect(
    new URL(`https://interview.domain.ru/${token}`, request.url)
  );
}
```
