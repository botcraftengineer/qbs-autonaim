import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsApiEndpoint } from "@/components/docs/docs-api-endpoint"
import { DocsFeedback } from "@/components/docs/docs-feedback"
import Link from "next/link"

export default function APIAnalyticsPage() {
  const tocItems = [
    { id: "dashboard", title: "Дашборд", level: 2 },
    { id: "vacancy-analytics", title: "Аналитика по вакансиям", level: 2 },
    { id: "export-data", title: "Экспорт данных", level: 2 },
    { id: "track-event", title: "Отслеживание событий", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API", href: "/api" }, { title: "Аналитика" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>API: Аналитика</h1>

        <p className="text-lg">
          Эндпоинты tRPC для получения аналитических данных: дашборды, статистика по вакансиям, экспорт и отслеживание событий.
        </p>

        <h2 id="dashboard">Получение дашборда</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="analytics.getDashboard"
          description="Возвращает основные метрики для дашборда workspace."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "period",
              type: "object",
              description: "Период для анализа {from, to}",
            },
          ]}
          response={`{
  "workspaceId": "ws_123",
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-14"
  },
  "metrics": {
    "totalVacancies": 12,
    "activeVacancies": 8,
    "totalResponses": 487,
    "newResponses": 89,
    "conversionRate": 0.23,
    "avgTimeToHire": 18.5
  },
  "funnel": {
    "new": 120,
    "screening_done": 95,
    "interview": 32,
    "technical_interview": 15,
    "offer_sent": 3,
    "onboarding": 1
  },
  "topSources": [
    {"source": "hh.ru", "count": 234},
    {"source": "superjob", "count": 89},
    {"source": "direct", "count": 67}
  ]
}`}
        />

        <h2 id="vacancy-analytics">Аналитика по вакансии</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="analytics.getVacancyAnalytics"
          description="Возвращает детальную аналитику по конкретной вакансии."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "vacancyId",
              type: "string",
              required: true,
              description: "ID вакансии",
            },
            {
              name: "period",
              type: "object",
              description: "Период для анализа {from, to}",
            },
          ]}
          response={`{
  "vacancyId": "vac_0190abcd123456789",
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-14"
  },
  "overview": {
    "title": "Frontend-разработчик",
    "views": 1250,
    "responses": 89,
    "conversionRate": 0.071,
    "avgTimeToResponse": 2.5
  },
  "dailyStats": [
    {
      "date": "2025-01-14",
      "views": 45,
      "responses": 3,
      "conversionRate": 0.067
    }
  ],
  "sources": [
    {"source": "hh.ru", "responses": 67, "conversionRate": 0.08},
    {"source": "telegram", "responses": 15, "conversionRate": 0.12},
    {"source": "direct", "responses": 7, "conversionRate": 0.15}
  ],
  "stages": {
    "new": 12,
    "screening_done": 8,
    "interview": 3,
    "technical_interview": 1,
    "offer_sent": 0,
    "onboarding": 0
  }
}`}
        />

        <h2 id="export-data">Экспорт данных</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="analytics.exportData"
          description="Экспортирует данные в различных форматах для анализа."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "type",
              type: "string",
              required: true,
              description: "Тип данных: candidates, vacancies, responses, analytics",
            },
            {
              name: "format",
              type: "string",
              description: "Формат: csv, xlsx, json",
            },
            {
              name: "filters",
              type: "object",
              description: "Фильтры для экспорта",
            },
          ]}
          response={`{
  "downloadUrl": "https://api.qbs-autonaim.ru/files/export/workspace_123_candidates_2025-01-14.csv",
  "filename": "workspace_123_candidates_2025-01-14.csv",
  "size": 2048576,
  "expiresAt": "2025-01-15T16:00:00.000Z"
}`}
        />

        <DocsCallout type="tip" title="Совет">
          Ссылка для скачивания действительна 24 часа. Используйте параметр filters для экспорта конкретных периодов или вакансий.
        </DocsCallout>

        <h2 id="track-event">Отслеживание событий</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="analytics.trackEvent"
          description="Отслеживает пользовательские события для аналитики."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "event",
              type: "string",
              required: true,
              description: "Название события",
            },
            {
              name: "data",
              type: "object",
              description: "Данные события",
            },
            {
              name: "candidateId",
              type: "string",
              description: "ID кандидата (если применимо)",
            },
            {
              name: "vacancyId",
              type: "string",
              description: "ID вакансии (если применимо)",
            },
          ]}
          response={`{
  "success": true,
  "eventId": "evt_0190abcd123456789",
  "timestamp": "2025-01-14T16:30:00.000Z"
}`}
        />

        <DocsCallout type="info" title="Примеры событий">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><code>candidate_viewed</code> — просмотр кандидата</li>
            <li><code>vacancy_published</code> — публикация вакансии</li>
            <li><code>interview_scheduled</code> — назначение собеседования</li>
            <li><code>offer_sent</code> — отправка оффера</li>
            <li><code>candidate_hired</code> — найм кандидата</li>
          </ul>
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/api/chat"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Чат
          </Link>
          <Link
            href="/docs"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Вернуться к началу
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
