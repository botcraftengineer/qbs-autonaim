import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import Link from "next/link"

export default function MetricsPage() {
  const tocItems = [
    { id: "key-metrics", title: "Ключевые метрики", level: 2 },
    { id: "efficiency-metrics", title: "Метрики эффективности", level: 2 },
    { id: "quality-metrics", title: "Метрики качества", level: 2 },
    { id: "benchmarks", title: "Бенчмарки", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Аналитика", href: "/analytics" }, { title: "Метрики найма" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Метрики найма</h1>

        <p className="text-lg">
          Ключевые показатели эффективности (KPI) найма помогают оценить результативность процесса и выявить области для
          улучшения.
        </p>

        <h2 id="key-metrics" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Ключевые метрики</h2>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Метрика</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Описание</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Формула</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Time to Fill</td>
                <td className="px-4 py-3 text-muted-foreground">Время от открытия вакансии до выхода сотрудника</td>
                <td className="px-4 py-3 text-muted-foreground">Дата выхода - Дата открытия</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Time to Hire</td>
                <td className="px-4 py-3 text-muted-foreground">Время от первого контакта до принятия оффера</td>
                <td className="px-4 py-3 text-muted-foreground">Дата оффера - Дата первого отклика</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Cost per Hire</td>
                <td className="px-4 py-3 text-muted-foreground">Стоимость найма одного сотрудника</td>
                <td className="px-4 py-3 text-muted-foreground">Общие затраты / Количество наймов</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Offer Acceptance Rate</td>
                <td className="px-4 py-3 text-muted-foreground">Доля принятых офферов</td>
                <td className="px-4 py-3 text-muted-foreground">Принятые офферы / Все офферы × 100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="efficiency-metrics" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Метрики эффективности</h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Конверсия воронки</strong> — процент кандидатов, прошедших от отклика до найма
          </li>
          <li>
            <strong className="font-semibold text-foreground">Источники кандидатов</strong> — количество и качество кандидатов из каждого источника
          </li>
          <li>
            <strong className="font-semibold text-foreground">Активность рекрутеров</strong> — количество обработанных кандидатов на рекрутера
          </li>
          <li>
            <strong className="font-semibold text-foreground">Скорость ответа</strong> — среднее время первого ответа кандидату
          </li>
        </ul>

        <h2 id="quality-metrics" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Метрики качества</h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Quality of Hire</strong> — оценка качества нанятых сотрудников через 3-6 месяцев
          </li>
          <li>
            <strong className="font-semibold text-foreground">Retention Rate</strong> — процент сотрудников, оставшихся после испытательного срока
          </li>
          <li>
            <strong className="font-semibold text-foreground">Hiring Manager Satisfaction</strong> — удовлетворённость нанимающих менеджеров
          </li>
          <li>
            <strong className="font-semibold text-foreground">Candidate Experience</strong> — оценка процесса найма кандидатами
          </li>
        </ul>

        <DocsCallout type="info" title="Автоматический сбор">
          QBS Автонайм автоматически собирает данные для расчёта всех метрик. Вам не нужно вести отдельные таблицы —
          просто используйте систему, и аналитика будет доступна.
        </DocsCallout>

        <h2 id="benchmarks" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Бенчмарки по отраслям</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">Сравнивайте свои показатели со средними по рынку:</p>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Отрасль</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Time to Fill</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Конверсия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground">IT</td>
                <td className="px-4 py-3 text-muted-foreground">25-35 дней</td>
                <td className="px-4 py-3 text-muted-foreground">3-5%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Финансы</td>
                <td className="px-4 py-3 text-muted-foreground">30-45 дней</td>
                <td className="px-4 py-3 text-muted-foreground">4-6%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Ритейл</td>
                <td className="px-4 py-3 text-muted-foreground">15-25 дней</td>
                <td className="px-4 py-3 text-muted-foreground">8-12%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Производство</td>
                <td className="px-4 py-3 text-muted-foreground">20-30 дней</td>
                <td className="px-4 py-3 text-muted-foreground">6-10%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/analytics/reports"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Отчёты
          </Link>
          <Link
            href="/analytics/roi"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            ROI найма
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
