import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCallout } from "@/components/docs-callout"
import { DocsToc } from "@/components/docs-toc"
import { DocsFeedback } from "@/components/docs-feedback"
import { DocsMobileToc } from "@/components/docs-mobile-toc"
import { DocsApiEndpoint } from "@/components/docs-api-endpoint"
import Link from "next/link"

export default function APICandidatesPage() {
  const tocItems = [
    { id: "list-candidates", title: "Список кандидатов", level: 2 },
    { id: "get-candidate", title: "Получение кандидата", level: 2 },
    { id: "create-candidate", title: "Создание кандидата", level: 2 },
    { id: "update-candidate", title: "Обновление кандидата", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API", href: "/api" }, { title: "Кандидаты" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>API: Кандидаты</h1>

        <p className="text-lg">
          Эндпоинты для работы с кандидатами: получение списка, создание, обновление и удаление.
        </p>

        <DocsMobileToc items={tocItems} />

        <h2 id="list-candidates">Список кандидатов</h2>

        <DocsApiEndpoint
          method="GET"
          path="/v1/candidates"
          description="Возвращает список кандидатов с пагинацией и фильтрацией."
          params={[
            {
              name: "vacancy_id",
              type: "string",
              description: "Фильтр по вакансии",
            },
            {
              name: "stage",
              type: "string",
              description: "Фильтр по этапу воронки",
            },
            {
              name: "limit",
              type: "number",
              description: "Количество записей (макс. 100)",
            },
            {
              name: "offset",
              type: "number",
              description: "Смещение для пагинации",
            },
          ]}
          response={`{
  "data": [
    {
      "id": "cand_abc123",
      "name": "Иван Петров",
      "email": "ivan@example.com",
      "phone": "+7 999 123-45-67",
      "vacancy_id": "vac_123",
      "stage": "hr_interview",
      "score": 85,
      "created_at": "2025-01-10T10:00:00Z"
    }
  ],
  "total": 47,
  "limit": 20,
  "offset": 0
}`}
        />

        <h2 id="get-candidate">Получение кандидата</h2>

        <DocsApiEndpoint
          method="GET"
          path="/v1/candidates/{id}"
          description="Возвращает полные данные одного кандидата, включая историю взаимодействий и результаты AI-скрининга."
          params={[
            {
              name: "id",
              type: "string",
              required: true,
              description: "Уникальный идентификатор кандидата",
            },
          ]}
          response={`{
  "id": "cand_abc123",
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "phone": "+7 999 123-45-67",
  "vacancy_id": "vac_123",
  "stage": "hr_interview",
  "score": 85,
  "skills": ["Python", "Django", "PostgreSQL"],
  "experience_years": 5,
  "education": "Высшее техническое",
  "screening_results": {
    "passed": true,
    "score": 85,
    "criteria_match": {
      "technical_skills": 90,
      "experience": 80,
      "education": 85
    }
  },
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-14T15:30:00Z"
}`}
        />

        <h2 id="create-candidate">Создание кандидата</h2>

        <DocsApiEndpoint
          method="POST"
          path="/v1/candidates"
          description="Создаёт нового кандидата и автоматически запускает AI-скрининг по критериям указанной вакансии."
          params={[
            {
              name: "name",
              type: "string",
              required: true,
              description: "Полное имя кандидата",
            },
            {
              name: "email",
              type: "string",
              required: true,
              description: "Email для связи",
            },
            {
              name: "phone",
              type: "string",
              description: "Номер телефона",
            },
            {
              name: "vacancy_id",
              type: "string",
              required: true,
              description: "ID вакансии для скрининга",
            },
            {
              name: "resume_url",
              type: "string",
              description: "Ссылка на резюме (PDF, DOC, DOCX)",
            },
          ]}
          response={`{
  "id": "cand_xyz789",
  "name": "Мария Сидорова",
  "email": "maria@example.com",
  "phone": "+7 999 987-65-43",
  "vacancy_id": "vac_123",
  "stage": "new",
  "score": null,
  "screening_status": "processing",
  "created_at": "2025-01-14T16:00:00Z"
}`}
        />

        <DocsCallout type="info" title="Асинхронная обработка">
          AI-скрининг выполняется асинхронно. Результаты появятся через 2-5 секунд. Используйте webhook
          candidate.screening_completed для получения уведомления.
        </DocsCallout>

        <h2 id="update-candidate">Обновление кандидата</h2>

        <DocsApiEndpoint
          method="PATCH"
          path="/v1/candidates/{id}"
          description="Обновляет данные кандидата. Можно передавать только изменяемые поля."
          params={[
            {
              name: "id",
              type: "string",
              required: true,
              description: "Уникальный идентификатор кандидата",
            },
            {
              name: "stage",
              type: "string",
              description: "Новый этап воронки найма",
            },
            {
              name: "notes",
              type: "string",
              description: "Заметки рекрутера",
            },
          ]}
          response={`{
  "id": "cand_abc123",
  "name": "Иван Петров",
  "stage": "technical_interview",
  "updated_at": "2025-01-14T16:30:00Z"
}`}
        />

        <DocsCallout type="info" title="Webhook">
          При изменении этапа кандидата автоматически отправляется webhook candidate.stage_changed на настроенный URL.
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/api/authentication"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Аутентификация
          </Link>
          <Link
            href="/api/vacancies"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Вакансии
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
