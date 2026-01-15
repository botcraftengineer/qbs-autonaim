import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCallout } from "@/components/docs-callout"
import { DocsToc } from "@/components/docs-toc"
import Link from "next/link"

export default function SuperJobIntegrationPage() {
  const tocItems = [
    { id: "features", title: "Возможности", level: 2 },
    { id: "setup", title: "Настройка", level: 2 },
    { id: "limitations", title: "Ограничения", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции", href: "/integrations" }, { title: "SuperJob" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1>Интеграция с SuperJob</h1>

        <p className="text-lg">
          Подключите SuperJob для расширения охвата кандидатов и синхронизации вакансий с одним из крупнейших
          job-порталов России.
        </p>

        <h2 id="features">Возможности интеграции</h2>

        <ul>
          <li>
            <strong>Импорт откликов</strong> — автоматическое получение откликов на ваши вакансии
          </li>
          <li>
            <strong>Публикация вакансий</strong> — размещение вакансий на SuperJob из QBS Автонайм
          </li>
          <li>
            <strong>Синхронизация данных</strong> — двусторонняя синхронизация статусов кандидатов
          </li>
        </ul>

        <h2 id="setup">Настройка интеграции</h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>{"Перейдите в «Настройки» → «Интеграции» → «SuperJob»"}</li>
          <li>{"Нажмите «Подключить»"}</li>
          <li>Введите API-ключ от вашего аккаунта работодателя SuperJob</li>
          <li>Выберите вакансии для синхронизации</li>
        </ol>

        <DocsCallout type="tip" title="Получение API-ключа">
          API-ключ можно получить в личном кабинете работодателя на SuperJob в разделе «Настройки API».
        </DocsCallout>

        <h2 id="limitations">Ограничения</h2>

        <p>В отличие от интеграции с hh.ru, интеграция с SuperJob имеет некоторые ограничения:</p>

        <ul>
          <li>Поиск по базе резюме недоступен через API</li>
          <li>Минимальный интервал синхронизации — 30 минут</li>
          <li>Не поддерживается автоматическая публикация вакансий (только импорт)</li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations/hh"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            hh.ru
          </Link>
          <Link
            href="/integrations/telegram"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Telegram
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
