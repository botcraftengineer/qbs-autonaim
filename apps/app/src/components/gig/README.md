# Gig Response Components

Компоненты для работы с откликами на gig задания.

## Компоненты

### ResponseDetailCard

Детальная карточка отклика с полной информацией.

```tsx
import { ResponseDetailCard } from "~/components/gig";

<ResponseDetailCard
  response={response}
  onAccept={() => handleAccept()}
  onReject={() => handleReject()}
  onMessage={() => handleMessage()}
  isProcessing={isProcessing}
/>
```

**Props:**
- `response` - данные отклика из `gig.responses.get`
- `onAccept?` - callback для принятия отклика
- `onReject?` - callback для отклонения отклика
- `onMessage?` - callback для отправки сообщения
- `isProcessing?` - флаг обработки действия

### ResponseListCard

Компактная карточка для списка откликов.

```tsx
import { ResponseListCard } from "~/components/gig";

<ResponseListCard
  response={response}
  orgSlug={orgSlug}
  workspaceSlug={workspaceSlug}
  gigId={gigId}
  onAccept={(id) => handleAccept(id)}
  onReject={(id) => handleReject(id)}
  onMessage={(id) => handleMessage(id)}
/>
```

**Props:**
- `response` - данные отклика из `gig.responses.list`
- `orgSlug` - slug организации
- `workspaceSlug` - slug workspace
- `gigId` - ID gig задания
- `onAccept?` - callback для принятия (получает responseId)
- `onReject?` - callback для отклонения (получает responseId)
- `onMessage?` - callback для сообщения (получает responseId)

### ResponseInvitationButton

Кнопка для отправки приглашения на интервью.

```tsx
import { ResponseInvitationButton } from "~/components/gig";

<ResponseInvitationButton
  responseId={response.id}
  candidateName={response.candidateName}
/>
```

## Использование в страницах

### Список откликов

```tsx
// apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/[gigId]/responses/page.tsx

import { ResponseListCard } from "~/components/gig";

const { data: responses } = useQuery({
  ...trpc.gig.responses.list.queryOptions({
    gigId,
    workspaceId: workspace?.id ?? "",
  }),
  enabled: !!workspace?.id,
});

return (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {responses?.map((response) => (
      <ResponseListCard
        key={response.id}
        response={response}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        gigId={gigId}
        onAccept={handleAccept}
        onReject={handleReject}
        onMessage={handleMessage}
      />
    ))}
  </div>
);
```

### Детальный просмотр

```tsx
// apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/[gigId]/responses/[responseId]/page.tsx

import { ResponseDetailCard } from "~/components/gig";

const { data: response } = useQuery({
  ...trpc.gig.responses.get.queryOptions({
    responseId,
    workspaceId: workspace?.id ?? "",
  }),
  enabled: !!workspace?.id,
});

return (
  <ResponseDetailCard
    response={response}
    onAccept={handleAccept}
    onReject={handleReject}
    onMessage={handleMessage}
    isProcessing={isProcessing}
  />
);
```

## Типы

```typescript
import type { RouterOutputs } from "@qbs-autonaim/api";

// Тип для списка откликов
type GigResponseListItem = RouterOutputs["gig"]["responses"]["list"][number];

// Тип для детального отклика
type GigResponseDetail = RouterOutputs["gig"]["responses"]["get"];
```

## Стилизация

Компоненты используют UI библиотеку `@qbs-autonaim/ui` и следуют дизайн-системе проекта:

- Адаптивная сетка
- Темная/светлая тема
- Анимации переходов
- Hover эффекты
- Focus индикаторы

## Доступность

Все компоненты следуют WAI-ARIA стандартам:

- Семантическая разметка
- Клавиатурная навигация
- Screen reader поддержка
- Контрастные цвета
- Адаптивные размеры кнопок
