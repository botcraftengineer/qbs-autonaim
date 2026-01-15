import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function AnalyticsPage() {
  const tocItems = [
    { id: "overview", title: "Доступные данные", level: 2 },
    { id: "dashboard", title: "Дашборд", level: 2 },
    { id: "sections", title: "Доступ к данным", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Аналитика" }, { title: "Обзор" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Аналитика</h1>

        <p className="text-lg">
          Базовая аналитика для отслеживания ключевых показателей процесса
          найма. Просматривайте статистику по кандидатам, вакансиям и
          источникам.
        </p>

        <h2 id="overview" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Доступные данные</h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Статистика по вакансиям</strong> — количество откликов,
            средняя оценка кандидатов
          </li>
          <li>
            <strong className="font-semibold text-foreground">Источники кандидатов</strong> — HeadHunter,
            фриланс-платформы, Gig-задания
          </li>
          <li>
            <strong className="font-semibold text-foreground">Распределение по оценкам</strong> — сколько кандидатов
            получили 1-5 звезд
          </li>
          <li>
            <strong className="font-semibold text-foreground">Активность по дням</strong> — динамика поступления откликов
          </li>
          <li>
            <strong className="font-semibold text-foreground">ROI найма</strong> — окупаемость инвестиций в процесс подбора
          </li>
        </ul>

        <h2 id="dashboard" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Дашборд</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">На главной странице отображаются основные метрики:</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Активные вакансии",
              value: "12",
              change: "Всего в системе",
            },
            {
              label: "Новые кандидаты",
              value: "847",
              change: "За последний месяц",
            },
            {
              label: "Средняя оценка",
              value: "3.2★",
              change: "По всем кандидатам",
            },
            { label: "Обработано", value: "156", change: "Прошли скрининг" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border p-4"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* PLACEHOLDER: Скриншот дашборда с аналитикой */}
        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">📸 Скриншот: Дашборд с метриками</p>
          <p className="text-xs text-muted-foreground">
            Показать карточки с метриками: Активные вакансии, Новые кандидаты, Средняя оценка, Обработано
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/workspaces/[slug] (главная страница workspace)
          </p>
        </div>


        <h2 id="sections" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Экспорт данных</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Все метрики и отчёты можно экспортировать для дальнейшего анализа.
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">CSV формат</strong> — для импорта в Excel или Google Sheets
          </li>
          <li>
            <strong className="font-semibold text-foreground">PDF отчёты</strong> — готовые презентационные материалы
          </li>
          <li>
            <strong className="font-semibold text-foreground">Графики и диаграммы</strong> — визуализация данных
          </li>
        </ul>

        <DocsCallout type="tip" title="Экспорт данных">
          Вы можете экспортировать все метрики и отчёты в CSV, Excel или JSON форматах
          для дальнейшего анализа в BI-системах или корпоративных дашбордах.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/ai-assistant/templates"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Шаблоны сообщений
          </Link>
          <Link
            href="/analytics/reports"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Отчёты
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
