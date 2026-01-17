import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function ROIPage() {
  const tocItems = [
    { id: "roi-metrics", title: "Метрики ROI", level: 2 },
    { id: "cost-analysis", title: "Анализ затрат", level: 2 },
    { id: "revenue-tracking", title: "Отслеживание доходов", level: 2 },
    { id: "break-even", title: "Точка безубыточности", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "Аналитика", href: "/analytics" }, { title: "ROI" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Аналитика</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          ROI найма
        </h1>

        <p className="text-lg">
          Анализ окупаемости инвестиций в процесс подбора персонала.
          Отслеживайте затраты на найм, эффективность рекрутеров и возврат от
          новых сотрудников.
        </p>

        <h2
          id="roi-metrics"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Ключевые метрики ROI
        </h2>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "ROI найма",
              value: "285%",
              change: "Средний по отрасли 200%",
            },
            {
              label: "Время окупаемости",
              value: "4.2 мес",
              change: "С момента выхода на работу",
            },
            {
              label: "Стоимость найма",
              value: "₽85,000",
              change: "На одного сотрудника",
            },
            {
              label: "Экономия на рекрутерах",
              value: "35%",
              change: "По сравнению с внешним наймом",
            },
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

        <h2
          id="cost-analysis"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Анализ затрат
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Система отслеживает все затраты, связанные с процессом найма:
        </p>

        <ul className="space-y-3">
          <li>
            <strong className="font-semibold text-foreground">
              Затраты на инструменты
            </strong>{" "}
            — стоимость подписок на платформы, интеграции и автоматизацию
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Время рекрутеров
            </strong>{" "}
            — внутренние затраты на работу HR-специалистов
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Внешние сервисы
            </strong>{" "}
            — агентства, headhunter, тесты и проверки кандидатов
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Процесс адаптации
            </strong>{" "}
            — затраты на onboarding новых сотрудников
          </li>
        </ul>

        <DocsCallout type="tip" title="Оптимизация затрат">
          Автоматизация рутинных задач позволяет сократить время на обработку
          одного кандидата с 2 часов до 15 минут, что значительно улучшает ROI
          процесса найма.
        </DocsCallout>

        <h2
          id="revenue-tracking"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Отслеживание доходов
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          ROI рассчитывается на основе реального вклада новых сотрудников в
          бизнес:
        </p>

        <div className="my-6 flex flex-col gap-3">
          {[
            {
              name: "Продуктивность сотрудника",
              description: "Доход, генерируемый сотрудником за период работы",
            },
            {
              name: "Экономия на замене",
              description:
                "Затраты, которых удалось избежать благодаря качественному найму",
            },
            {
              name: "Рост команды",
              description:
                "Как новые сотрудники влияют на общую производительность",
            },
            {
              name: "Качество найма",
              description:
                "Метрики retention и удовлетворённости новых сотрудников",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-lg border border-border p-4"
            >
              <h4 className="font-medium text-foreground">{item.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <h2
          id="break-even"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Точка безубыточности
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Анализ показывает, через какое время новый сотрудник окупает затраты
          на его найм:
        </p>

        <ul className="space-y-2">
          <li>
            <strong className="font-semibold text-foreground">
              Среднее время:
            </strong>{" "}
            4-6 месяцев для IT-специалистов
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Факторы влияния:
            </strong>{" "}
            уровень позиции, опыт кандидата, скорость адаптации
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Мониторинг:
            </strong>{" "}
            ежемесячные отчёты по окупаемости инвестиций
          </li>
        </ul>

        <DocsCallout type="info">
          Регулярный анализ ROI помогает принимать обоснованные решения о
          бюджете на найм и эффективности инвестиций в HR-процессы.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/analytics/metrics"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Метрики найма
          </Link>
          <Link
            href="/candidates"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Кандидаты
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
