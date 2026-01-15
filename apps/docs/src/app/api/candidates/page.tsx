import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsFeedback } from "@/components/docs/docs-feedback"
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc"
import { DocsApiEndpoint } from "@/components/docs/docs-api-endpoint"
import Link from "next/link"

export default function APICandidatesPage() {
  const tocItems = [
    { id: "list-candidates", title: "Список кандидатов", level: 2 },
    { id: "get-candidate", title: "Получение кандидата", level: 2 },
    { id: "update-candidate", title: "Обновление кандидата", level: 2 },
    { id: "additional-operations", title: "Дополнительные операции", level: 2 },
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
          Эндпоинты tRPC для работы с кандидатами: получение списка, создание, обновление и управление этапами.
        </p>

        <DocsMobileToc items={tocItems} />

        <h2 id="list-candidates">Список кандидатов</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="candidates.list"
          description="Возвращает список кандидатов с пагинацией и фильтрацией по workspace."
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
              description: "Фильтр по вакансии",
            },
            {
              name: "limit",
              type: "number",
              description: "Количество записей (макс. 200, по умолчанию 100)",
            },
            {
              name: "cursor",
              type: "string",
              description: "Курсор для пагинации",
            },
            {
              name: "search",
              type: "string",
              description: "Поиск по имени кандидата или названию вакансии",
            },
            {
              name: "stages",
              type: "string[]",
              description: "Фильтр по этапам: SCREENING_DONE, INTERVIEW, OFFER_SENT, SECURITY_PASSED, CONTRACT_SENT, ONBOARDING, REJECTED",
            },
          ]}
          response={`{
  "items": [
    {
      "id": "0190abcd123456789",
      "name": "Иван Петров",
      "position": "Frontend-разработчик",
      "avatarFileId": "file_xyz789",
      "initials": "ИП",
      "experience": "5 лет",
      "location": "Не указано",
      "matchScore": 85,
      "stage": "INTERVIEW",
      "status": "INTERVIEW",
      "hrSelectionStatus": null,
      "vacancyId": "vac_123",
      "vacancyName": "Frontend-разработчик",
      "salaryExpectation": "Не указано",
      "email": "ivan@example.com",
      "phone": "+7 999 123-45-67",
      "telegram": "@ivan_petrov",
      "messageCount": 5,
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-14T15:30:00.000Z"
    }
  ],
  "nextCursor": "0190abcd123456790",
  "total": 47
}`}
        />

        <h2 id="get-candidate">Получение кандидата</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="candidates.getById"
          description="Возвращает полные данные одного кандидата по ID."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "Уникальный идентификатор кандидата (response ID)",
            },
          ]}
          response={`// Возвращает полную информацию о кандидате включая:
// - Данные резюме и контакты
// - Результаты скрининга
// - Историю сообщений
// - Активности
// - Комментарии
{
  "id": "0190abcd123456789",
  "candidateName": "Иван Петров",
  "email": "ivan@example.com",
  "phone": "+7 999 123-45-67",
  "experience": "5 лет frontend-разработки",
  "skills": ["React", "TypeScript", "Node.js"],
  "vacancyId": "vac_123",
  "stage": "INTERVIEW",
  "screening": {
    "detailedScore": 85,
    "criteriaMatch": {
      "technical_skills": 90,
      "experience": 80,
      "education": 85
    }
  },
  "createdAt": "2025-01-10T10:00:00.000Z",
  "updatedAt": "2025-01-14T15:30:00.000Z"
}`}
        />

        <h2 id="update-candidate">Обновление кандидата</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="candidates.updateStage"
          description="Обновляет этап кандидата в воронке найма."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
            {
              name: "stage",
              type: "string",
              required: true,
              description: "Новый этап: SCREENING_DONE, INTERVIEW, OFFER_SENT, SECURITY_PASSED, CONTRACT_SENT, ONBOARDING, REJECTED",
            },
          ]}
          response={`{
  "success": true,
  "candidate": {
    "id": "0190abcd123456789",
    "stage": "TECHNICAL_INTERVIEW",
    "updatedAt": "2025-01-14T16:30:00.000Z"
  }
}`}
        />

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="candidates.updateSalaryExpectations"
          description="Обновляет зарплатные ожидания кандидата."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
            {
              name: "salaryExpectation",
              type: "string",
              required: true,
              description: "Зарплатные ожидания",
            },
          ]}
          response={`{
  "success": true,
  "candidate": {
    "id": "0190abcd123456789",
    "salaryExpectation": "150 000 - 200 000 ₽",
    "updatedAt": "2025-01-14T16:30:00.000Z"
  }
}`}
        />

        <h2 id="additional-operations">Дополнительные операции</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="candidates.sendGreeting"
          description="Отправляет приветственное сообщение кандидату."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
          ]}
        />

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="candidates.sendOffer"
          description="Отправляет оффер кандидату."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
          ]}
        />

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="candidates.rejectCandidate"
          description="Отклоняет кандидата."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
          ]}
        />

        <DocsApiEndpoint
          method="tRPC Query"
          path="candidates.listActivities"
          description="Возвращает историю активностей кандидата."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
          ]}
        />

        <DocsApiEndpoint
          method="tRPC Query"
          path="candidates.listMessages"
          description="Возвращает сообщения чата с кандидатом."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "id",
              type: "string",
              required: true,
              description: "ID кандидата",
            },
          ]}
        />

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
