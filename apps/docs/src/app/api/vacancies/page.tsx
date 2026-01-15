import Link from "next/link";
import { DocsApiEndpoint } from "@/components/docs/docs-api-endpoint";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCode } from "@/components/docs/docs-code";
import { DocsToc } from "@/components/docs/docs-toc";

export default function APIVacanciesPage() {
  const tocItems = [
    { id: "list-vacancies", title: "Список вакансий", level: 2 },
    { id: "get-vacancy", title: "Получение вакансии", level: 2 },
    { id: "create-vacancy", title: "Создание вакансии", level: 2 },
    { id: "vacancy-statistics", title: "Статистика вакансии", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "API", href: "/api" }, { title: "Вакансии" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>API: Вакансии</h1>

        <p className="text-lg">
          Эндпоинты tRPC для управления вакансиями: создание, обновление,
          получение статистики и управление откликами.
        </p>

        <h2 id="list-vacancies">Список вакансий</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="vacancy.list"
          description="Возвращает список вакансий с количеством реальных откликов."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
          ]}
          response={`{
  "id": "0190abcd123456789",
  "workspaceId": "ws_123",
  "title": "Frontend-разработчик",
  "url": "https://hh.ru/vacancy/123456",
  "views": 1250,
  "responses": 89,
  "newResponses": 12,
  "resumesInProgress": 5,
  "suitableResumes": 23,
  "region": "Москва",
  "description": "Ищем опытного Frontend-разработчика...",
  "requirements": ["React от 3 лет", "TypeScript", "English B2+"],
  "source": "hh.ru",
  "externalId": "123456",
  "customBotInstructions": "Обращайся к кандидатам по имени",
  "customScreeningPrompt": "Обрати внимание на опыт с React",
  "customInterviewQuestions": ["Расскажи о сложном проекте"],
  "customOrganizationalQuestions": ["Почему выбрал нашу компанию?"],
  "isActive": true,
  "realResponsesCount": 89,
  "createdAt": "2025-01-05T09:00:00.000Z",
  "updatedAt": "2025-01-14T15:30:00.000Z"
}`}
        />

        <h2 id="get-vacancy">Получение вакансии</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="vacancy.get"
          description="Возвращает полные данные вакансии по ID."
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
              description: "ID вакансии",
            },
          ]}
          response={`{
  "id": "0190abcd123456789",
  "title": "Frontend-разработчик",
  "description": "Полное описание вакансии...",
  "requirements": ["React от 3 лет", "TypeScript", "English B2+"],
  "region": "Москва",
  "salary": {
    "from": 150000,
    "to": 250000,
    "currency": "RUB"
  },
  "customBotInstructions": "Обращайся к кандидатам по имени",
  "customScreeningPrompt": "Обрати внимание на опыт с React",
  "isActive": true,
  "createdAt": "2025-01-05T09:00:00.000Z",
  "updatedAt": "2025-01-14T15:30:00.000Z"
}`}
        />

        <h2 id="create-vacancy">Создание вакансии</h2>

        <DocsApiEndpoint
          method="tRPC Mutation"
          path="vacancy.create"
          description="Создает новую вакансию в workspace."
          params={[
            {
              name: "workspaceId",
              type: "string",
              required: true,
              description: "ID workspace",
            },
            {
              name: "title",
              type: "string",
              required: true,
              description: "Название вакансии",
            },
            {
              name: "description",
              type: "string",
              required: true,
              description: "Описание вакансии",
            },
            {
              name: "requirements",
              type: "string[]",
              description: "Требования к кандидату",
            },
            {
              name: "region",
              type: "string",
              description: "Регион или город",
            },
            {
              name: "customBotInstructions",
              type: "string",
              description: "Инструкции для AI-ассистента",
            },
          ]}
          response={`{
  "id": "0190abcd123456790",
  "title": "Backend-разработчик",
  "workspaceId": "ws_123",
  "isActive": true,
  "createdAt": "2025-01-14T16:00:00.000Z",
  "updatedAt": "2025-01-14T16:00:00.000Z"
}`}
        />

        <h2 id="vacancy-statistics">Статистика вакансии</h2>

        <DocsApiEndpoint
          method="tRPC Query"
          path="vacancy.analytics"
          description="Возвращает аналитику по вакансии: воронку, конверсию, источники."
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
  "vacancyId": "0190abcd123456789",
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-14"
  },
  "funnel": {
    "new": 120,
    "screening_done": 95,
    "interview": 32,
    "technical_interview": 15,
    "offer_sent": 3,
    "onboarding": 1
  },
  "conversionRate": 0.83,
  "avgTimeToHire": 18,
  "sources": {
    "hh.ru": 78,
    "kwork": 17,
    "telegram": 12
  }
}`}
        />

        <DocsCallout type="tip" title="Совет">
          Используйте эндпоинт статистики для построения собственных дашбордов
          или интеграции с BI-системами.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/api/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Кандидаты
          </Link>
          <Link
            href="/docs"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Вернуться к началу
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
