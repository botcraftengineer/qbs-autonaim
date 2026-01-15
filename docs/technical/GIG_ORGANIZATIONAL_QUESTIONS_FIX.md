# Исправление: Организационные вопросы для Gig

## Проблема

Поле `customOrganizationalQuestions` существовало в схеме `gig`, но не использовалось в интервью:

1. ❌ Отсутствовало в UI компоненте настроек gig
2. ❌ Принудительно устанавливалось в `null` в сервисе интервью
3. ❌ Не обрабатывалось в API роутере обновления

## Решение

### 1. UI компонент (`gig-interview-settings.tsx`)

Добавлено поле для редактирования организационных вопросов:

```tsx
<Textarea
  id="customOrganizationalQuestions"
  name="customOrganizationalQuestions"
  value={customOrganizationalQuestions}
  onChange={(e) => handleChange(setCustomOrganizationalQuestions, e.target.value)}
  placeholder="Вопросы о доступности, сроках, условиях работы…"
/>
```

### 2. Сервис интервью (`interview-service.ts`)

Исправлена логика, теперь организационные вопросы используются для gig:

```typescript
customOrganizationalQuestions: isGig
  ? gig?.customOrganizationalQuestions || null  // ✅ Используем настройки gig
  : vacancy?.customOrganizationalQuestions || null,
```

### 3. API роутер (`update.ts`)

Добавлена обработка поля при обновлении:

```typescript
if (input.settings.customOrganizationalQuestions !== undefined) {
  patch.customOrganizationalQuestions = input.settings.customOrganizationalQuestions;
}
```

### 4. AI агенты

Обновлены комментарии для ясности:
- `interview-start.ts` - организационные вопросы могут быть как для vacancy, так и для gig
- `interviewer.ts` - уточнена логика определения типа интервью

## Результат

✅ Все настройки gig теперь участвуют в интервью:
- `customBotInstructions` - общие инструкции для бота
- `customScreeningPrompt` - промпт для скрининга
- `customInterviewQuestions` - технические вопросы
- `customOrganizationalQuestions` - организационные вопросы
- `interviewMedia` - медиафайлы для интервью

## Тестирование

Для проверки:
1. Открыть настройки gig
2. Заполнить поле "Организационные вопросы"
3. Сохранить настройки
4. Запустить интервью для gig
5. Убедиться, что бот задает организационные вопросы
