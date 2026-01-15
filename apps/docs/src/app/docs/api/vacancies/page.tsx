import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import Link from "next/link"

export default function APIVacanciesPage() {
  const tocItems = [
    { id: "list-vacancies", title: "Список вакансий", level: 2 },
    { id: "get-vacancy", title: "Получение вакансии", level: 2 },
    { id: "create-vacancy", title: "Создание вакансии", level: 2 },
    { id: "vacancy-statistics", title: "Статистика вакансии", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API", href: "/docs/api" }, { title: "Вакансии" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>API: Вакансии</h1>

        <p className="text-lg">
          Эндпоинты для управления вакансиями: создание, обновление, публикация и получение статистики.
        </p>

        <h2 id="list-vacancies">Список вакансий</h2>

        <div className="my-4 flex items-center gap-2">
          <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-600">GET</span>
          <code className="text-sm">/v1/vacancies</code>
        </div>

        <p>Возвращает список вакансий с пагинацией.</p>

        <DocsCode
          title="Пример запроса"
          language="bash"
          code={`curl -X GET "https://api.qbs-autonaim.ru/v1/vacancies?status=active" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />

        <DocsCode
          title="Пример ответа"
          language="json"
          code={`{
  "data": [
    {
      "id": "vac_xyz789",
      "title": "Frontend-разработчик",
      "department": "Разработка",
      "location": "Москва",
      "status": "active",
      "candidates_count": 47,
      "created_at": "2025-01-05T09:00:00Z"
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}`}
        />

        <h2 id="get-vacancy">Получение вакансии</h2>

        <div className="my-4 flex items-center gap-2">
          <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-600">GET</span>
          <code className="text-sm">{"/v1/vacancies/{id}"}</code>
        </div>

        <p>Возвращает полные данные вакансии, включая описание и критерии скрининга.</p>

        <h2 id="create-vacancy">Создание вакансии</h2>

        <div className="my-4 flex items-center gap-2">
          <span className="rounded bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-600">POST</span>
          <code className="text-sm">/v1/vacancies</code>
        </div>

        <DocsCode
          title="Пример запроса"
          language="bash"
          code={`curl -X POST "https://api.qbs-autonaim.ru/v1/vacancies" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Backend-разработчик",
    "department": "Разработка",
    "location": "Москва",
    "description": "Ищем опытного backend-разработчика...",
    "requirements": [
      "Python от 3 лет",
      "Опыт с PostgreSQL",
      "Знание Docker"
    ],
    "salary_from": 200000,
    "salary_to": 350000
  }'`}
        />

        <h2 id="vacancy-statistics">Статистика вакансии</h2>

        <div className="my-4 flex items-center gap-2">
          <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-600">GET</span>
          <code className="text-sm">{"/v1/vacancies/{id}/statistics"}</code>
        </div>

        <p>Возвращает статистику по вакансии: воронку, конверсию, источники кандидатов.</p>

        <DocsCode
          title="Пример ответа"
          language="json"
          code={`{
  "vacancy_id": "vac_xyz789",
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-14"
  },
  "funnel": {
    "new": 120,
    "screening": 95,
    "hr_interview": 32,
    "technical_interview": 15,
    "offer": 3,
    "hired": 1
  },
  "conversion_rate": 0.83,
  "avg_time_to_hire": 18,
  "sources": {
    "hh.ru": 78,
    "superjob": 25,
    "direct": 17
  }
}`}
        />

        <DocsCallout type="tip" title="Совет">
          Используйте эндпоинт статистики для построения собственных дашбордов или интеграции с BI-системами.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/docs/api/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Кандидаты
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
