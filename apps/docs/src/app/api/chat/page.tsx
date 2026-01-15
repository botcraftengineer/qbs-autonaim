import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsApiEndpoint } from "@/components/docs/docs-api-endpoint"
import { DocsFeedback } from "@/components/docs/docs-feedback"
import Link from "next/link"

export default function APIChatPage() {
  const tocItems = [
    { id: "create-session", title: "Создание сессии", level: 2 },
    { id: "send-message", title: "Отправка сообщения", level: 2 },
    { id: "get-history", title: "Получение истории", level: 2 },
    { id: "clear-history", title: "Очистка истории", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API", href: "/api" }, { title: "Чат" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>API: Чат</h1>

        <p className="text-lg">
          Эндпоинты tRPC для работы с AI-чатом: создание сессий, отправка сообщений и управление историей.
        </p>

        <h2 id="create-session">Создание сессии чата</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="chat.createSession"
          description="Создает новую сессию чата с кандидатом или для общего использования."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "candidateId",
              type: "string",
              description: "ID кандидата (опционально)",
            },
            {
              name: "title",
              type: "string",
              description: "Название сессии",
            },
          ]}
          response={`{
  "id": "chat_0190abcd123456789",
  "workspaceId": "ws_123",
  "candidateId": "cand_456",
  "title": "Собеседование с Иваном Петровым",
  "createdAt": "2025-01-14T16:00:00.000Z",
  "updatedAt": "2025-01-14T16:00:00.000Z"
}`}
        />

        <h2 id="send-message">Отправка сообщения</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="chat.sendMessage"
          description="Отправляет сообщение в сессию чата и получает ответ AI."
          params={[
            {
              name: "sessionId",
              type: "string",
              required: true,
              description: "ID сессии чата",
            },
            {
              name: "content",
              type: "string",
              required: true,
              description: "Текст сообщения",
            },
            {
              name: "role",
              type: "string",
              description: "Роль: user, assistant, system",
            },
          ]}
          response={`{
  "id": "msg_0190abcd123456790",
  "sessionId": "chat_0190abcd123456789",
  "content": "Спасибо за информацию! Расскажите подробнее о вашем опыте...",
  "role": "assistant",
  "createdAt": "2025-01-14T16:05:00.000Z"
}`}
        />

        <DocsCallout type="info" title="AI-ответ">
          AI автоматически анализирует контекст кандидата и вакансии для формирования релевантных ответов.
        </DocsCallout>

        <h2 id="get-history">Получение истории чата</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="chat.getHistory"
          description="Возвращает историю сообщений в сессии."
          params={[
            {
              name: "sessionId",
              type: "string",
              required: true,
              description: "ID сессии чата",
            },
            {
              name: "limit",
              type: "number",
              description: "Количество сообщений (макс. 100)",
            },
            {
              name: "cursor",
              type: "string",
              description: "Курсор для пагинации",
            },
          ]}
          response={`{
  "items": [
    {
      "id": "msg_0190abcd123456789",
      "sessionId": "chat_0190abcd123456789",
      "content": "Здравствуйте! Расскажите о своем опыте работы с React?",
      "role": "user",
      "createdAt": "2025-01-14T16:00:00.000Z"
    },
    {
      "id": "msg_0190abcd123456790",
      "sessionId": "chat_0190abcd123456789",
      "content": "Здравствуйте! У меня 3 года опыта работы с React...",
      "role": "assistant",
      "createdAt": "2025-01-14T16:01:00.000Z"
    }
  ],
  "nextCursor": "msg_0190abcd123456791",
  "total": 25
}`}
        />

        <h2 id="clear-history">Очистка истории чата</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="chat.clearHistory"
          description="Очищает историю сообщений в сессии."
          params={[
            {
              name: "sessionId",
              type: "string",
              required: true,
              description: "ID сессии чата",
            },
          ]}
          response={`{
  "success": true,
  "sessionId": "chat_0190abcd123456789",
  "deletedCount": 25
}`}
        />

        <DocsCallout type="warning" title="Важно">
          Очистка истории необратима. Убедитесь, что вы хотите удалить все сообщения в сессии.
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/api/vacancies"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Вакансии
          </Link>
          <Link
            href="/api/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аналитика
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
