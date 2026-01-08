# Changes Summary

## Что было сделано

Создан отдельный Next.js сервис для AI-интервью с чистым URL. Старый код полностью удален из `apps/app`.

## Удаленные файлы

### Из apps/app

```
apps/app/src/app/interview/              # Удалена вся директория
apps/app/src/app/api/interview/          # Удалена вся директория
apps/app/src/components/interview-landing-form.tsx  # Удален
apps/app/src/components/web-chat-interface.tsx      # Удален
```

## Новые файлы и директории

### 1. Interview Service (`apps/interview/`)

Полностью новый Next.js app для интервью:

```
apps/interview/
├── src/
│   ├── app/
│   │   ├── [token]/
│   │   │   ├── page.tsx                    # Лендинг интервью
│   │   │   ├── chat/page.tsx               # Чат интервью
│   │   │   └── not-found.tsx
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/route.ts        # tRPC endpoints
│   │   │   └── interview/
│   │   │       ├── chat/stream/
│   │   │       │   ├── route.ts
│   │   │       │   └── handler.ts          # AI streaming
│   │   │       └── upload-voice/
│   │   │           ├── route.ts
│   │   │           └── handler.ts          # Voice upload
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
├── tsconfig.json
├── postcss.config.js
├── Dockerfile
├── .gitignore
└── README.md
```

### 2. Interview UI Package (`packages/interview-ui/`)

Новый shared package для UI компонентов интервью:

```
packages/interview-ui/
├── src/
│   ├── interview-landing-form.tsx
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Изменения в существующих файлах

### packages/config/src/routes.ts
- ❌ Удален `interview: (token: string) => \`/interview/${token}\``

### packages/api/src/services/
- ✅ Обновлен `InterviewLinkGenerator` - использует `NEXT_PUBLIC_INTERVIEW_URL`
- ✅ Обновлен `GigInterviewLinkGenerator` - использует `NEXT_PUBLIC_INTERVIEW_URL`

### packages/api/src/routers/
- ✅ Обновлены все роуты для генерации ссылок на новый URL
- ❌ Удалены импорты `paths` из `@qbs-autonaim/config`

### packages/jobs/src/services/
- ✅ Обновлен `invitation-generator` - использует `NEXT_PUBLIC_INTERVIEW_URL`

### apps/app/src/components/gig/
- ✅ Обновлен `gig-invitation-template.tsx` - использует `NEXT_PUBLIC_INTERVIEW_URL`

## URL изменения

### До
```
https://domain.ru/interview/[token]
https://domain.ru/interview/[token]/chat
```

### После
```
https://interview.domain.ru/[token]
https://interview.domain.ru/[token]/chat
```

## Environment Variables

Новая переменная для `.env`:

```env
# Interview Service URL
NEXT_PUBLIC_INTERVIEW_URL=https://interview.domain.ru
```

## Что НЕ изменилось

1. **Database schema** - Без изменений
2. **tRPC procedures** - Без изменений
3. **Бизнес-логика** - Scoring, questions, status остались без изменений

## Следующие шаги

### 1. Deployment

```bash
# Vercel
# Создайте новый проект для apps/interview
# Root Directory: apps/interview
# Domain: interview.domain.ru
```

### 2. DNS

Настройте A/CNAME запись для `interview.domain.ru`

### 3. Environment Variables

Добавьте в `.env` и Vercel:

```env
NEXT_PUBLIC_INTERVIEW_URL=https://interview.domain.ru
```

### 4. Тестирование

```bash
# Локально
bun run dev --filter=@qbs-autonaim/interview

# Доступ
http://localhost:3001/[token]
```

## Преимущества

1. ✅ Чистый URL (`/[token]` вместо `/interview/[token]`)
2. ✅ Изоляция (независимое развертывание)
3. ✅ Производительность (меньше бандла)
4. ✅ Безопасность (отдельный домен)
5. ✅ Масштабируемость (отдельное масштабирование)
6. ✅ Shared UI (переиспользование компонентов)
7. ✅ Чистый код (удален старый код из apps/app)

## Команды

```bash
# Development
bun run dev --filter=@qbs-autonaim/interview

# Build
bun run build --filter=@qbs-autonaim/interview

# Start
bun run start --filter=@qbs-autonaim/interview

# Install dependencies
bun install

# Type check
bun run typecheck --filter=@qbs-autonaim/interview

# Lint
bun run lint --filter=@qbs-autonaim/interview
```

## Размер изменений

- **Удаленных файлов**: ~10 (из apps/app)
- **Новых файлов**: ~30
- **Новых строк кода**: ~3000
- **Новых packages**: 2 (`apps/interview`, `packages/interview-ui`)
- **Измененных файлов**: ~10 (обновление URL генераторов)

