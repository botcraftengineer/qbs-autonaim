import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCard } from "@/components/docs/docs-card"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import { Key, Users, Briefcase, MessageSquare, BarChart3 } from "lucide-react"
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
          tRPC API QBS Автонайм позволяет программно управлять кандидатами, вакансиями и другими ресурсами. Используйте
          API для интеграции с вашими внутренними системами.
        </p>

        <h2 id="overview">Обзор</h2>

        <ul>
          <li>
            <strong>Протокол</strong> — tRPC через HTTPS
          </li>
          <li>
            <strong>Формат данных</strong> — JSON
          </li>
          <li>
            <strong>Аутентификация</strong> — Сессии пользователя
          </li>
          <li>
            <strong>Типизация</strong> — Автоматическая TypeScript типизация
          </li>
        </ul>

        <h2 id="base-url">Базовый URL</h2>

        <DocsCode code="http://localhost:3000/api/trpc" language="text" title="tRPC Endpoint" />

        <p className="text-sm text-muted-foreground mt-2">
          Для production используйте ваш домен: <code>https://your-domain.com/api/trpc</code>
        </p>

        <h2 id="authentication">Аутентификация</h2>

        <p>tRPC API использует сессионную аутентификацию. Для доступа необходимо:</p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Войти в систему через веб-интерфейс</li>
          <li>Использовать tRPC клиент с cookies сессии</li>
          <li>Указывать workspaceId в каждом запросе</li>
        </ol>

        <DocsCallout type="info" title="Рекомендация">
          Используйте официальный tRPC клиент для автоматической обработки сессий и полной типизации.
        </DocsCallout>

        <h2 id="endpoints">Основные эндпоинты</h2>

        <div className="grid gap-4 sm:grid-cols-1 my-6">
          <DocsCard
            title="Аутентификация"
            description="Настройка сессий и управление доступом к workspace."
            href="/api/authentication"
            icon={<Key className="h-5 w-5" />}
          />
          <DocsCard
            title="Кандидаты"
            description="Управление кандидатами, этапами воронки, сообщениями."
            href="/api/candidates"
            icon={<Users className="h-5 w-5" />}
          />
          <DocsCard
            title="Вакансии"
            description="Создание вакансий, аналитика, управление откликами."
            href="/api/vacancies"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <DocsCard
            title="Чат"
            description="AI-ассистент, сессии чата, общение с кандидатами."
            href="/api/chat"
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <DocsCard
            title="Аналитика"
            description="Дашборды, статистика, экспорт данных, события."
            href="/api/analytics"
            icon={<BarChart3 className="h-5 w-5" />}
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
