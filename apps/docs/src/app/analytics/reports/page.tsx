import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function ReportsPage() {
  const tocItems = [
    { id: "report-types", title: "Типы отчётов", level: 2 },
    { id: "custom-reports", title: "Пользовательские отчёты", level: 2 },
    { id: "export", title: "Экспорт данных", level: 2 },
    { id: "scheduled-reports", title: "Автоматические отчёты", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Аналитика", href: "/analytics" },
            { title: "Отчёты" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Отчёты
        </h1>

        <p className="text-lg">
          Система отчётов QBS Автонайм предоставляет детальную информацию о
          процессе найма в удобном для анализа формате.
        </p>

        <h2
          id="report-types"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Готовые отчёты
        </h2>

        <div className="my-6 flex flex-col gap-3">
          {[
            {
              name: "Воронка найма",
              description:
                "Визуализация движения кандидатов по этапам с конверсией",
            },
            {
              name: "Эффективность источников",
              description:
                "Сравнение источников кандидатов по количеству и качеству",
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
            <div
              key={report.name}
              className="rounded-lg border border-border p-4"
            >
              <h4 className="font-medium text-foreground">{report.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {report.description}
              </p>
            </div>
          ))}
        </div>

        <h2
          id="custom-reports"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Пользовательские отчёты
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Создавайте собственные отчёты с нужными вам метриками и фильтрами:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            {"Перейдите в раздел «Аналитика» → «Отчёты» → «Создать отчёт»"}
          </li>
          <li className="text-foreground/80">
            Выберите метрики, которые хотите отслеживать
          </li>
          <li className="text-foreground/80">
            Настройте фильтры (период, вакансии, источники)
          </li>
          <li className="text-foreground/80">
            Выберите тип визуализации (таблица, график, диаграмма)
          </li>
          <li className="text-foreground/80">
            Сохраните отчёт для быстрого доступа
          </li>
        </ol>

        <h2
          id="export"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Экспорт данных
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Данные можно экспортировать в следующих форматах:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Excel (.xlsx)
            </strong>{" "}
            — полные данные с возможностью дальнейшего анализа
          </li>
          <li>
            <strong className="font-semibold text-foreground">CSV</strong> —
            универсальный формат для импорта в другие системы
          </li>
          <li>
            <strong className="font-semibold text-foreground">PDF</strong> —
            готовый отчёт для презентации руководству
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Google Sheets
            </strong>{" "}
            — прямая выгрузка в Google-таблицу
          </li>
        </ul>

        <h2
          id="scheduled-reports"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Автоматические отчёты
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Настройте автоматическую отправку отчётов на email:
        </p>

        <DocsCallout type="tip">
          Рекомендуем настроить еженедельную отправку отчёта по воронке найма
          руководителю — это помогает держать процесс под контролем без
          дополнительных усилий.
        </DocsCallout>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Расписание
            </strong>{" "}
            — ежедневно, еженедельно, ежемесячно или в определённые дни
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Получатели
            </strong>{" "}
            — укажите email-адреса для отправки
          </li>
          <li>
            <strong className="font-semibold text-foreground">Формат</strong> —
            выберите формат вложения (Excel, PDF)
          </li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Обзор
          </Link>
          <Link
            href="/analytics/metrics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Метрики найма
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
