import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCard } from "@/components/docs/docs-card"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import { Key, Users, Briefcase } from "lucide-react"
import Link from "next/link"

export default function APIPage() {
  const tocItems = [
    { id: "overview", title: "Обзор", level: 2 },
    { id: "base-url", title: "Базовый URL", level: 2 },
    { id: "authentication", title: "Аутентификация", level: 2 },
    { id: "endpoints", title: "Эндпоинты", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "API" }, { title: "Введение" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">API</span>
        </div>

        <h1>API Reference</h1>

        <p className="text-lg">
          REST API QBS Автонайм позволяет программно управлять кандидатами, вакансиями и другими ресурсами. Используйте
          API для интеграции с вашими внутренними системами.
        </p>

        <h2 id="overview">Обзор</h2>

        <ul>
          <li>
            <strong>Протокол</strong> — HTTPS (HTTP не поддерживается)
          </li>
          <li>
            <strong>Формат данных</strong> — JSON
          </li>
          <li>
            <strong>Аутентификация</strong> — Bearer Token
          </li>
          <li>
            <strong>Лимиты</strong> — 1000 запросов в минуту
          </li>
        </ul>

        <h2 id="base-url">Базовый URL</h2>

        <DocsCode code="https://api.qbs-autonaim.ru/v1" language="text" title="Base URL" />

        <h2 id="authentication">Аутентификация</h2>

        <p>Все запросы к API должны содержать заголовок Authorization с вашим API-ключом:</p>

        <DocsCode
          code={`curl -X GET "https://api.qbs-autonaim.ru/v1/candidates" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
          language="bash"
          title="Пример запроса"
        />

        <DocsCallout type="warning" title="Безопасность">
          Никогда не публикуйте API-ключ в клиентском коде или публичных репозиториях. Храните его в переменных
          окружения на сервере.
        </DocsCallout>

        <h2 id="endpoints">Основные эндпоинты</h2>

        <div className="grid gap-4 sm:grid-cols-1 my-6">
          <DocsCard
            title="Аутентификация"
            description="Получение и управление API-ключами, проверка токенов."
            href="/api/authentication"
            icon={<Key className="h-5 w-5" />}
          />
          <DocsCard
            title="Кандидаты"
            description="CRUD-операции с кандидатами, поиск, фильтрация, массовые действия."
            href="/api/candidates"
            icon={<Users className="h-5 w-5" />}
          />
          <DocsCard
            title="Вакансии"
            description="Управление вакансиями, публикация, архивирование."
            href="/api/vacancies"
            icon={<Briefcase className="h-5 w-5" />}
          />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations/webhooks"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Webhooks
          </Link>
          <Link
            href="/api/authentication"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аутентификация
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
