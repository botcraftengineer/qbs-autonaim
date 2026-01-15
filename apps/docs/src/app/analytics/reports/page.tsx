import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCallout } from "@/components/docs-callout"
import { DocsToc } from "@/components/docs-toc"
import Link from "next/link"

export default function ReportsPage() {
  const tocItems = [
    { id: "report-types", title: "Типы отчётов", level: 2 },
    { id: "custom-reports", title: "Пользовательские отчёты", level: 2 },
    { id: "export", title: "Экспорт данных", level: 2 },
    { id: "scheduled-reports", title: "Автоматические отчёты", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Аналитика", href: "/analytics" }, { title: "Отчёты" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1>Отчёты</h1>

        <p className="text-lg">
          Система отчётов QBS Автонайм предоставляет детальную информацию о процессе найма в удобном для анализа
          формате.
        </p>

        <h2 id="report-types">Готовые отчёты</h2>

        <div className="my-6 flex flex-col gap-3">
          {[
            {
              name: "Воронка найма",
              description: "Визуализация движения кандидатов по этапам с конверсией",
            },
            {
              name: "Эффективность источников",
              description: "Сравнение источников кандидатов по количеству и качеству",
            },
            {
              name: "Активность рекрутеров",
              description: "Статистика работы каждого рекрутера команды",
            },
            {
              name: "Время закрытия",
              description: "Анализ времени на каждом этапе воронки",
            },
            {
              name: "Причины отказов",
              description: "Статистика причин отказов кандидатам",
            },
          ].map((report) => (
            <div key={report.name} className="rounded-lg border border-border p-4">
              <h4 className="font-medium text-foreground">{report.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
            </div>
          ))}
        </div>

        <h2 id="custom-reports">Пользовательские отчёты</h2>

        <p>Создавайте собственные отчёты с нужными вам метриками и фильтрами:</p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>{"Перейдите в раздел «Аналитика» → «Отчёты» → «Создать отчёт»"}</li>
          <li>Выберите метрики, которые хотите отслеживать</li>
          <li>Настройте фильтры (период, вакансии, источники)</li>
          <li>Выберите тип визуализации (таблица, график, диаграмма)</li>
          <li>Сохраните отчёт для быстрого доступа</li>
        </ol>

        <h2 id="export">Экспорт данных</h2>

        <p>Данные можно экспортировать в следующих форматах:</p>

        <ul>
          <li>
            <strong>Excel (.xlsx)</strong> — полные данные с возможностью дальнейшего анализа
          </li>
          <li>
            <strong>CSV</strong> — универсальный формат для импорта в другие системы
          </li>
          <li>
            <strong>PDF</strong> — готовый отчёт для презентации руководству
          </li>
          <li>
            <strong>Google Sheets</strong> — прямая выгрузка в Google-таблицу
          </li>
        </ul>

        <h2 id="scheduled-reports">Автоматические отчёты</h2>

        <p>Настройте автоматическую отправку отчётов на email:</p>

        <DocsCallout type="tip">
          Рекомендуем настроить еженедельную отправку отчёта по воронке найма руководителю — это помогает держать
          процесс под контролем без дополнительных усилий.
        </DocsCallout>

        <ul>
          <li>
            <strong>Расписание</strong> — ежедневно, еженедельно, ежемесячно или в определённые дни
          </li>
          <li>
            <strong>Получатели</strong> — укажите email-адреса для отправки
          </li>
          <li>
            <strong>Формат</strong> — выберите формат вложения (Excel, PDF)
          </li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Обзор
          </Link>
          <Link
            href="/analytics/metrics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Метрики найма
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
