import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCard } from "@/components/docs-card"
import { DocsToc } from "@/components/docs-toc"
import { DocsCallout } from "@/components/docs-callout"
import { Briefcase, MessageCircle, Code2 } from "lucide-react"
import Link from "next/link"

export default function IntegrationsPage() {
  const tocItems = [
    { id: "available-integrations", title: "Доступные интеграции", level: 2 },
    { id: "job-sites", title: "Job-сайты", level: 3 },
    { id: "messengers", title: "Мессенджеры", level: 3 },
    { id: "developers", title: "Разработчикам", level: 3 },
    { id: "setup", title: "Настройка интеграций", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции" }, { title: "Обзор" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1>Интеграции</h1>

        <p className="text-lg">
          QBS Автонайм интегрируется с популярными job-сайтами, мессенджерами и HR-системами для автоматизации потока
          кандидатов.
        </p>

        <h2 id="available-integrations">Доступные интеграции</h2>

        <h3 id="job-sites" className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Job-сайты
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 my-4">
          <DocsCard
            title="hh.ru"
            description="Автоматический импорт откликов и публикация вакансий на крупнейшем job-сайте России."
            href="/integrations/hh"
          />
          <DocsCard
            title="SuperJob"
            description="Синхронизация вакансий и кандидатов с SuperJob."
            href="/integrations/superjob"
          />
        </div>

        <h3 id="messengers" className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Мессенджеры
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 my-4">
          <DocsCard
            title="Telegram"
            description="Общение с кандидатами через Telegram-бота, уведомления для рекрутеров."
            href="/integrations/telegram"
          />
          <DocsCard
            title="WhatsApp"
            description="Коммуникация через WhatsApp Business API."
            href="/integrations/whatsapp"
          />
        </div>

        <h3 id="developers" className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          Разработчикам
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 my-4">
          <DocsCard
            title="Webhooks"
            description="Получайте уведомления о событиях в реальном времени."
            href="/integrations/webhooks"
          />
          <DocsCard title="REST API" description="Полный доступ к данным через API." href="/api" />
        </div>

        <h2 id="setup">Настройка интеграций</h2>

        <p>Для подключения интеграции:</p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>{"Перейдите в «Настройки» → «Интеграции»"}</li>
          <li>Найдите нужную интеграцию и нажмите «Подключить»</li>
          <li>Следуйте инструкциям для авторизации</li>
          <li>Настройте параметры синхронизации</li>
        </ol>

        <DocsCallout type="info" title="Безопасность">
          Все интеграции используют OAuth 2.0 или API-ключи. Ваши учётные данные от внешних сервисов никогда не хранятся
          в QBS Автонайм.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/analytics/metrics"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Метрики найма
          </Link>
          <Link
            href="/integrations/hh"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            hh.ru
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
