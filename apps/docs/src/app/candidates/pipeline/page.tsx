import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function PipelinePage() {
  const tocItems = [
    { id: "pipeline-overview", title: "Обзор воронки", level: 2 },
    { id: "default-stages", title: "Основные этапы", level: 2 },
    { id: "customization", title: "Управление кандидатами", level: 2 },
    { id: "automation", title: "Фильтрация и поиск", level: 2 },
    { id: "bulk-actions", title: "Экспорт данных", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Работа с кандидатами", href: "/candidates" },
            { title: "Воронка найма" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1>Воронка найма</h1>

        <p className="text-lg">
          Воронка найма позволяет отслеживать статус кандидатов и управлять их
          движением через этапы отбора. Простая и понятная система для
          организации процесса найма.
        </p>

        <h2 id="pipeline-overview">Обзор воронки</h2>

        <p>
          Каждый кандидат находится на определённом этапе воронки. Вы можете
          перемещать кандидатов между этапами по мере прохождения процесса
          отбора.
        </p>

        <p>Основные возможности:</p>

        <ul>
          <li>
            <strong>Управление этапами</strong> — перемещайте кандидатов между
            статусами
          </li>
          <li>
            <strong>Фильтрация</strong> — отображайте кандидатов по оценке,
            дате, источнику
          </li>
          <li>
            <strong>История изменений</strong> — отслеживайте все перемещения
            кандидата
          </li>
          <li>
            <strong>Статистика</strong> — видите количество кандидатов на каждом
            этапе
          </li>
        </ul>

        <h2 id="default-stages">Основные этапы</h2>

        <p>Воронка включает базовые этапы для управления кандидатами:</p>

        <div className="my-6 flex flex-col gap-2">
          {[
            {
              name: "Новый",
              description: "Кандидаты, только импортированные в систему",
            },
            {
              name: "Скрининг",
              description: "Проходят AI-оценку (1-5 звезд)",
            },
            {
              name: "Интервью",
              description: "Назначено или проведено интервью",
            },
            { name: "Оффер", description: "Отправлено предложение о работе" },
            { name: "Нанят", description: "Кандидат принял оффер" },
            { name: "Отказ", description: "Кандидат не подошёл или отказался" },
          ].map((stage, index) => (
            <div
              key={stage.name}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                {index + 1}
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {stage.name}
                </span>
                <span className="mx-2 text-muted-foreground">—</span>
                <span className="text-sm text-muted-foreground">
                  {stage.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DocsCallout type="info" title="Гибкость">
          Этапы можно адаптировать под ваш процесс найма. Система отслеживает
          все изменения статуса кандидата.
        </DocsCallout>

        <h2 id="customization">Управление кандидатами</h2>

        <p>Основные действия с кандидатами в воронке:</p>

        <ul>
          <li>
            <strong>Изменение этапа</strong> — перемещайте кандидата между
            статусами
          </li>
          <li>
            <strong>Добавление комментариев</strong> — оставляйте заметки о
            кандидате
          </li>
          <li>
            <strong>Просмотр истории</strong> — отслеживайте все действия с
            кандидатом
          </li>
          <li>
            <strong>Отправка сообщений</strong> — общайтесь через Telegram или
            веб-интервью
          </li>
        </ul>

        <h2 id="automation">Фильтрация и поиск</h2>

        <p>Используйте фильтры для быстрого поиска нужных кандидатов:</p>

        <ul>
          <li>
            <strong>По оценке</strong> — показать только 4-5 звезд
          </li>
          <li>
            <strong>По источнику</strong> — HeadHunter, Upwork, Kwork и др.
          </li>
          <li>
            <strong>По дате</strong> — новые за последнюю неделю
          </li>
          <li>
            <strong>По вакансии</strong> — кандидаты конкретной позиции
          </li>
        </ul>

        <h2 id="bulk-actions">Экспорт данных</h2>

        <p>Выгружайте данные о кандидатах для анализа:</p>

        <ul>
          <li>Экспорт списка кандидатов в Excel</li>
          <li>Выгрузка резюме в PDF</li>
          <li>Статистика по этапам воронки</li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/scoring"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Скоринг кандидатов
          </Link>
          <Link
            href="/ai-assistant"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            AI-ассистент
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
