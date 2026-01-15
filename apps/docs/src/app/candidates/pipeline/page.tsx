import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import Link from "next/link"

export default function PipelinePage() {
  const tocItems = [
    { id: "pipeline-overview", title: "Обзор воронки", level: 2 },
    { id: "default-stages", title: "Стандартные этапы", level: 2 },
    { id: "customization", title: "Настройка этапов", level: 2 },
    { id: "automation", title: "Автоматизация", level: 2 },
    { id: "bulk-actions", title: "Массовые действия", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "Работа с кандидатами", href: "/candidates" }, { title: "Воронка найма" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Работа с кандидатами</span>
        </div>

        <h1>Воронка найма</h1>

        <p className="text-lg">
          Воронка найма (пайплайн) позволяет визуализировать и управлять движением кандидатов через этапы отбора.
          Отслеживайте конверсию, выявляйте узкие места и оптимизируйте процесс найма.
        </p>

        <h2 id="pipeline-overview">Обзор воронки</h2>

        <p>
          Воронка найма представляет собой канбан-доску, где каждая колонка соответствует этапу отбора. Кандидаты
          перемещаются между этапами по мере прохождения процесса.
        </p>

        <p>Основные возможности:</p>

        <ul>
          <li>
            <strong>Drag-and-drop</strong> — перетаскивайте карточки кандидатов между этапами
          </li>
          <li>
            <strong>Фильтрация</strong> — отображайте только нужных кандидатов по баллу, дате, источнику
          </li>
          <li>
            <strong>Групповые операции</strong> — выделяйте несколько кандидатов для массовых действий
          </li>
          <li>
            <strong>Статистика</strong> — видите количество кандидатов и конверсию на каждом этапе
          </li>
        </ul>

        <h2 id="default-stages">Стандартные этапы</h2>

        <p>По умолчанию воронка содержит следующие этапы:</p>

        <div className="my-6 flex flex-col gap-2">
          {[
            { name: "Новый", description: "Кандидаты, только поступившие в систему" },
            { name: "Скрининг", description: "Проходят первичную оценку AI" },
            { name: "HR-интервью", description: "Назначено или проведено интервью с HR" },
            { name: "Техническое интервью", description: "Интервью с нанимающим менеджером" },
            { name: "Финальное интервью", description: "Финальный этап перед оффером" },
            { name: "Оффер", description: "Отправлено предложение о работе" },
            { name: "Нанят", description: "Кандидат принял оффер" },
            { name: "Отказ", description: "Кандидат не подошёл или отказался" },
          ].map((stage, index) => (
            <div key={stage.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                {index + 1}
              </div>
              <div>
                <span className="font-medium text-foreground">{stage.name}</span>
                <span className="mx-2 text-muted-foreground">—</span>
                <span className="text-sm text-muted-foreground">{stage.description}</span>
              </div>
            </div>
          ))}
        </div>

        <h2 id="customization">Настройка этапов</h2>

        <p>Вы можете полностью настроить воронку под ваш процесс найма:</p>

        <ul>
          <li>
            <strong>Добавление этапов</strong> — создавайте новые этапы в любом месте воронки
          </li>
          <li>
            <strong>Переименование</strong> — давайте этапам понятные названия
          </li>
          <li>
            <strong>Изменение порядка</strong> — перетаскивайте этапы для изменения последовательности
          </li>
          <li>
            <strong>Удаление</strong> — убирайте ненужные этапы (кандидаты будут перемещены на предыдущий этап)
          </li>
          <li>
            <strong>Цветовая маркировка</strong> — назначайте цвета для визуального различения
          </li>
        </ul>

        <DocsCallout type="warning" title="Внимание">
          Изменение структуры воронки влияет на всех кандидатов по вакансии. Перед внесением изменений убедитесь, что
          это не нарушит текущий процесс.
        </DocsCallout>

        <h2 id="automation">Автоматизация</h2>

        <p>Настройте автоматические действия при переходе кандидата на определённый этап:</p>

        <ul>
          <li>
            <strong>Отправка писем</strong> — автоматическое уведомление кандидата о статусе
          </li>
          <li>
            <strong>Уведомления команде</strong> — оповещение коллег в Telegram или по email
          </li>
          <li>
            <strong>Назначение собеседования</strong> — автоматическая отправка ссылки на календарь
          </li>
          <li>
            <strong>Webhook</strong> — отправка данных во внешние системы
          </li>
        </ul>

        <DocsCallout type="tip" title="Пример автоматизации">
          При переходе кандидата на этап «HR-интервью» автоматически отправляется письмо с приглашением выбрать удобное
          время через Calendly.
        </DocsCallout>

        <h2 id="bulk-actions">Массовые действия</h2>

        <p>Для работы с несколькими кандидатами одновременно:</p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Выделите нужных кандидатов с помощью чекбоксов или Shift+клик</li>
          <li>{"Выберите действие в появившемся меню «Массовые действия»"}</li>
          <li>Подтвердите выполнение</li>
        </ol>

        <p>Доступные массовые действия:</p>

        <ul>
          <li>Перемещение на другой этап</li>
          <li>Отправка сообщения</li>
          <li>Назначение тегов</li>
          <li>Экспорт в Excel</li>
          <li>Архивирование</li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/scoring"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Скоринг кандидатов
          </Link>
          <Link
            href="/ai-assistant"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            AI-ассистент
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
