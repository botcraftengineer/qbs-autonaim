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
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Аналитика" }, { title: "Обзор" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1>Аналитика</h1>

        <p className="text-lg">
          Базовая аналитика для отслеживания ключевых показателей процесса
          найма. Просматривайте статистику по кандидатам, вакансиям и
          источникам.
        </p>

        <h2 id="overview">Доступные данные</h2>

        <ul>
          <li>
            <strong>Статистика по вакансиям</strong> — количество откликов,
            средняя оценка кандидатов
          </li>
          <li>
            <strong>Источники кандидатов</strong> — HeadHunter,
            фриланс-платформы, Gig-задания
          </li>
          <li>
            <strong>Распределение по оценкам</strong> — сколько кандидатов
            получили 1-5 звезд
          </li>
          <li>
            <strong>Активность по дням</strong> — динамика поступления откликов
          </li>
        </ul>

        <h2 id="dashboard">Дашборд</h2>

        <p>На главной странице отображаются основные метрики:</p>

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

        <DocsCallout type="info" title="Экспорт данных">
          Вы можете выгрузить данные через tRPC API для построения собственных
          отчётов и дашбордов.
        </DocsCallout>

        <h2 id="sections">Доступ к данным</h2>

        <p>
          Для получения аналитических данных используйте tRPC API. Доступны
          следующие методы:
        </p>

        <ul>
          <li>
            <code>analytics.getDashboard</code> — общая статистика по workspace
          </li>
          <li>
            <code>analytics.getVacancyAnalytics</code> — детальная аналитика по
            вакансии
          </li>
          <li>
            <code>analytics.exportData</code> — экспорт данных в различных
            форматах
          </li>
          <li>
            <code>analytics.trackEvent</code> — отслеживание пользовательских
            событий
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
