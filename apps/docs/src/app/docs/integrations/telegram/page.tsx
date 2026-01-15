import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsSteps } from "@/components/docs/docs-steps"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import Link from "next/link"

export default function TelegramIntegrationPage() {
  const tocItems = [
    { id: "use-cases", title: "Сценарии использования", level: 2 },
    { id: "bot-setup", title: "Настройка бота", level: 2 },
    { id: "notifications", title: "Уведомления", level: 2 },
    { id: "candidate-chat", title: "Чат с кандидатами", level: 2 },
  ]

  const botSetupSteps = [
    {
      title: "Создайте бота в Telegram",
      content: (
        <p>
          Напишите @BotFather в Telegram, выполните команду /newbot и следуйте инструкциям. Сохраните полученный токен.
        </p>
      ),
    },
    {
      title: "Добавьте токен в QBS Автонайм",
      content: <p>{"Перейдите в «Настройки» → «Интеграции» → «Telegram» и вставьте токен бота."}</p>,
    },
    {
      title: "Настройте команды бота",
      content: <p>Определите список команд, которые будет поддерживать ваш бот для кандидатов.</p>,
    },
    {
      title: "Опубликуйте ссылку на бота",
      content: <p>Добавьте ссылку на бота в описание вакансий и на карьерный сайт.</p>,
    },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции", href: "/docs/integrations" }, { title: "Telegram" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1>Интеграция с Telegram</h1>

        <p className="text-lg">
          Telegram-интеграция позволяет общаться с кандидатами через мессенджер и получать мгновенные уведомления о
          событиях в системе.
        </p>

        <h2 id="use-cases">Сценарии использования</h2>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">Для рекрутеров</h4>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>Уведомления о новых откликах</li>
              <li>Напоминания о собеседованиях</li>
              <li>Быстрые действия с кандидатами</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">Для кандидатов</h4>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>Отклик на вакансии через бота</li>
              <li>Отслеживание статуса заявки</li>
              <li>Общение с AI-ассистентом</li>
            </ul>
          </div>
        </div>

        <h2 id="bot-setup">Настройка Telegram-бота</h2>

        <DocsSteps steps={botSetupSteps} />

        <h2 id="notifications">Уведомления для команды</h2>

        <p>Настройте уведомления для вашей команды рекрутеров:</p>

        <ul>
          <li>
            <strong>Личные уведомления</strong> — каждый рекрутер получает уведомления по своим вакансиям
          </li>
          <li>
            <strong>Групповой чат</strong> — все уведомления в общий чат команды
          </li>
          <li>
            <strong>Канал</strong> — публикация важных событий в Telegram-канал
          </li>
        </ul>

        <DocsCode
          title="Пример уведомления"
          language="text"
          code={`🆕 Новый отклик на вакансию "Frontend-разработчик"

👤 Иван Петров
📍 Москва
💼 5 лет опыта
⭐ Балл: 87/100

[Посмотреть профиль] [Одобрить] [Отклонить]`}
        />

        <h2 id="candidate-chat">Чат с кандидатами</h2>

        <p>Кандидаты могут общаться с AI-ассистентом через Telegram-бота. Бот поддерживает следующие функции:</p>

        <ul>
          <li>Просмотр списка вакансий</li>
          <li>Отклик на вакансию с прикреплением резюме</li>
          <li>Проверка статуса заявки</li>
          <li>Ответы на вопросы о вакансии и компании</li>
          <li>Назначение и подтверждение собеседований</li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Добавьте username бота в текст вакансии на job-сайтах — это увеличит конверсию откликов, так как кандидатам
          удобнее писать в мессенджер.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/docs/integrations/superjob"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            SuperJob
          </Link>
          <Link
            href="/docs/integrations/webhooks"
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
