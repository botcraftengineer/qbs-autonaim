import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import Link from "next/link"

export default function WhatsAppIntegrationPage() {
  const tocItems = [
    { id: "overview", title: "Обзор", level: 2 },
    { id: "setup", title: "Настройка", level: 2 },
    { id: "templates", title: "Шаблоны сообщений", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции", href: "/integrations" }, { title: "WhatsApp" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1>Интеграция с WhatsApp</h1>

        <p className="text-lg">
          Общайтесь с кандидатами через WhatsApp Business API — один из самых популярных мессенджеров в мире.
        </p>

        <h2 id="overview">Обзор</h2>

        <p>Интеграция с WhatsApp позволяет:</p>

        <ul>
          <li>Отправлять уведомления кандидатам через WhatsApp</li>
          <li>Получать ответы кандидатов в едином интерфейсе QBS Автонайм</li>
          <li>Использовать AI-ассистента для автоматических ответов</li>
          <li>Отправлять файлы и документы</li>
        </ul>

        <DocsCallout type="info" title="Требования">
          Для интеграции необходим аккаунт WhatsApp Business и доступ к WhatsApp Business API (через Meta Business
          Suite).
        </DocsCallout>

        <h2 id="setup">Настройка интеграции</h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Создайте аккаунт в Meta Business Suite</li>
          <li>Настройте WhatsApp Business API</li>
          <li>{"Перейдите в QBS Автонайм → «Настройки» → «Интеграции» → «WhatsApp»"}</li>
          <li>Введите учётные данные API (Phone Number ID, Access Token)</li>
          <li>Верифицируйте номер телефона</li>
        </ol>

        <h2 id="templates">Шаблоны сообщений</h2>

        <p>
          WhatsApp требует использования одобренных шаблонов для исходящих сообщений. QBS Автонайм предоставляет набор
          готовых шаблонов:
        </p>

        <ul>
          <li>Подтверждение получения отклика</li>
          <li>Приглашение на собеседование</li>
          <li>Напоминание о собеседовании</li>
          <li>Запрос обратной связи</li>
        </ul>

        <DocsCallout type="warning" title="Модерация">
          Все шаблоны должны быть одобрены Meta. Процесс модерации занимает от нескольких часов до 1-2 дней.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations/telegram"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Telegram
          </Link>
          <Link
            href="/integrations/webhooks"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Webhooks
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
