import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCard } from "@/components/docs-card"
import { DocsToc } from "@/components/docs-toc"
import { FileBarChart, Target } from "lucide-react"
import Link from "next/link"

export default function AnalyticsPage() {
  const tocItems = [
    { id: "overview", title: "Обзор", level: 2 },
    { id: "dashboard", title: "Дашборд", level: 2 },
    { id: "sections", title: "Разделы", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Аналитика" }, { title: "Обзор" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1>Аналитика найма</h1>

        <p className="text-lg">
          Аналитика QBS Автонайм помогает отслеживать эффективность процесса найма, выявлять узкие места и принимать
          решения на основе данных.
        </p>

        <h2 id="overview">Обзор возможностей</h2>

        <ul>
          <li>
            <strong>Реальное время</strong> — данные обновляются автоматически без перезагрузки
          </li>
          <li>
            <strong>Визуализация</strong> — графики, диаграммы и таблицы для удобного анализа
          </li>
          <li>
            <strong>Фильтрация</strong> — анализ по вакансиям, периодам, источникам, рекрутерам
          </li>
          <li>
            <strong>Экспорт</strong> — выгрузка данных в Excel, PDF, Google Sheets
          </li>
          <li>
            <strong>Автоматические отчёты</strong> — регулярная отправка отчётов на email
          </li>
        </ul>

        <h2 id="dashboard">Главный дашборд</h2>

        <p>На главном дашборде отображаются ключевые показатели:</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Активные вакансии", value: "12", change: "+2 за неделю" },
            { label: "Новые кандидаты", value: "847", change: "+23% к прошлому месяцу" },
            { label: "Среднее время закрытия", value: "18 дней", change: "-3 дня к прошлому кварталу" },
            { label: "Конверсия воронки", value: "4.2%", change: "+0.5% к прошлому месяцу" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-xs text-primary mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        <h2 id="sections">Разделы аналитики</h2>

        <div className="grid gap-4 sm:grid-cols-1 my-6">
          <DocsCard
            title="Отчёты"
            description="Готовые и настраиваемые отчёты по всем аспектам найма. Экспорт и автоматическая отправка."
            href="/analytics/reports"
            icon={<FileBarChart className="h-5 w-5" />}
          />
          <DocsCard
            title="Метрики найма"
            description="Ключевые показатели эффективности: время закрытия, стоимость найма, качество источников."
            href="/analytics/metrics"
            icon={<Target className="h-5 w-5" />}
          />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/ai-assistant/templates"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Шаблоны сообщений
          </Link>
          <Link
            href="/analytics/reports"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Отчёты
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
