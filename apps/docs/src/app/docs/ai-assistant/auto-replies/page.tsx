import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsSteps } from "@/components/docs/docs-steps"
import Link from "next/link"

export default function AutoRepliesPage() {
  const tocItems = [
    { id: "auto-reply-types", title: "Типы автоответов", level: 2 },
    { id: "setup", title: "Настройка", level: 2 },
    { id: "triggers", title: "Триггеры", level: 2 },
    { id: "personalization", title: "Персонализация", level: 2 },
  ]

  const setupSteps = [
    {
      title: "Перейдите в настройки автоответов",
      content: <p>{"Откройте раздел «AI-ассистент» → «Автоответы» в главном меню."}</p>,
    },
    {
      title: "Создайте новое правило",
      content: <p>{"Нажмите «Добавить правило» и выберите тип триггера (ключевые слова, событие, расписание)."}</p>,
    },
    {
      title: "Настройте условия",
      content: <p>Укажите, при каких условиях должен срабатывать автоответ.</p>,
    },
    {
      title: "Выберите шаблон или напишите текст",
      content: <p>Используйте готовый шаблон или создайте собственный текст ответа.</p>,
    },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "AI-ассистент", href: "/docs/ai-assistant" }, { title: "Автоответы" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">AI-ассистент</span>
        </div>

        <h1>Автоответы</h1>

        <p className="text-lg">
          Автоответы позволяют AI-ассистенту мгновенно реагировать на сообщения кандидатов и события в системе без
          участия рекрутера.
        </p>

        <h2 id="auto-reply-types">Типы автоответов</h2>

        <div className="my-6 flex flex-col gap-4">
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">Ответы на вопросы</h3>
            <p className="text-sm text-muted-foreground">
              AI распознаёт типичные вопросы кандидатов (о зарплате, графике, требованиях) и отвечает на них
              автоматически.
            </p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">Подтверждение получения</h3>
            <p className="text-sm text-muted-foreground">
              Автоматическое подтверждение получения отклика или резюме с информацией о следующих шагах.
            </p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">Напоминания</h3>
            <p className="text-sm text-muted-foreground">
              Автоматические напоминания о назначенных собеседованиях за сутки и за час до встречи.
            </p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-semibold text-foreground mb-2">Статусные уведомления</h3>
            <p className="text-sm text-muted-foreground">
              Уведомления кандидатов при переходе на новый этап воронки или изменении статуса заявки.
            </p>
          </div>
        </div>

        <h2 id="setup">Настройка автоответов</h2>

        <DocsSteps steps={setupSteps} />

        <h2 id="triggers">Триггеры автоответов</h2>

        <p>Автоответы могут срабатывать по различным триггерам:</p>

        <ul>
          <li>
            <strong>Ключевые слова</strong> — при упоминании определённых слов в сообщении кандидата
          </li>
          <li>
            <strong>Событие</strong> — при наступлении события (новый отклик, смена статуса, назначение собеседования)
          </li>
          <li>
            <strong>Расписание</strong> — в определённое время (например, напоминание за сутки до собеседования)
          </li>
          <li>
            <strong>Бездействие</strong> — если кандидат не отвечает в течение заданного времени
          </li>
        </ul>

        <DocsCallout type="warning" title="Важно">
          Не создавайте слишком много автоответов с пересекающимися условиями — это может привести к спаму и раздражению
          кандидатов.
        </DocsCallout>

        <h2 id="personalization">Персонализация</h2>

        <p>Используйте переменные для персонализации автоответов:</p>

        <div className="my-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Переменная</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{"{{candidate.name}}"}</td>
                <td className="px-4 py-3 text-muted-foreground">Имя кандидата</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{"{{vacancy.title}}"}</td>
                <td className="px-4 py-3 text-muted-foreground">Название вакансии</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{"{{company.name}}"}</td>
                <td className="px-4 py-3 text-muted-foreground">Название компании</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{"{{interview.date}}"}</td>
                <td className="px-4 py-3 text-muted-foreground">Дата собеседования</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">{"{{recruiter.name}}"}</td>
                <td className="px-4 py-3 text-muted-foreground">Имя рекрутера</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/docs/ai-assistant/chat"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Чат с кандидатами
          </Link>
          <Link
            href="/docs/ai-assistant/templates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Шаблоны сообщений
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
