import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCode } from "@/components/docs/docs-code";
import { DocsToc } from "@/components/docs/docs-toc";

export default function GigPage() {
  const tocItems = [
    { id: "overview", title: "Что такое Gig-задания", level: 2 },
    { id: "creation", title: "Создание задания", level: 2 },
    { id: "responses", title: "Управление откликами", level: 2 },
    { id: "shortlist", title: "Шорт-лист кандидатов", level: 2 },
    { id: "interview", title: "AI-интервью", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Работа с кандидатами", href: "/candidates" },
            { title: "Gig-задания" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1>Gig-задания</h1>

        <p className="text-lg">
          Gig-задания позволяют публиковать краткосрочные проекты на
          фриланс-платформах и автоматически обрабатывать отклики с помощью AI.
          Идеально для быстрого поиска исполнителей на разовые задачи.
        </p>

        <h2 id="overview">Что такое Gig-задания</h2>

        <p>
          Gig-задания — это краткосрочные проекты, которые публикуются на
          фриланс-платформах:
        </p>

        <ul>
          <li>
            <strong>Kwork</strong> — российская платформа микрозаданий
          </li>
          <li>
            <strong>FL.ru</strong> — крупнейшая российская биржа фриланса
          </li>
          <li>
            <strong>Freelance.ru</strong> — платформа для профессионалов
          </li>
          <li>
            <strong>Habr Freelance</strong> — биржа для IT-специалистов
          </li>
        </ul>

        <DocsCallout type="info" title="Автоматизация">
          Система автоматически импортирует отклики с платформ, оценивает
          кандидатов через AI (1-5 звезд) и формирует шорт-лист лучших
          исполнителей.
        </DocsCallout>

        <h2 id="creation">Создание задания</h2>

        <p>Чтобы создать новое Gig-задание:</p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Перейдите в раздел «Gig-задания»</li>
          <li>Нажмите «Создать задание»</li>
          <li>Заполните описание проекта, бюджет и сроки</li>
          <li>Выберите платформы для публикации</li>
          <li>Настройте критерии отбора для AI</li>
        </ol>

        <DocsCode
          title="Пример структуры задания"
          language="typescript"
          code={`{
  title: "Разработка Telegram-бота",
  description: "Нужен бот для автоматизации рассылок",
  budget: { min: 30000, max: 50000, currency: "RUB" },
  deadline: "2024-02-15",
  platforms: ["kwork", "fl.ru", "habr"],
  requirements: {
    skills: ["Node.js", "Telegram Bot API"],
    experience: "1+ год",
    portfolio: true
  }
}`}
        />

        <h2 id="responses">Управление откликами</h2>

        <p>После публикации задания система автоматически:</p>

        <ul>
          <li>
            <strong>Импортирует отклики</strong> — собирает заявки с выбранных
            платформ
          </li>
          <li>
            <strong>Оценивает кандидатов</strong> — AI анализирует портфолио и
            опыт
          </li>
          <li>
            <strong>Присваивает рейтинг</strong> — от 1 до 5 звезд
          </li>
          <li>
            <strong>Фильтрует спам</strong> — отсеивает нерелевантные отклики
          </li>
        </ul>

        <p>Вы можете просматривать все отклики в едином интерфейсе:</p>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Поле
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Описание
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground">Имя</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Имя фрилансера
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Оценка AI</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Рейтинг 1-5 звезд
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Платформа</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Источник отклика
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Цена</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Предложенная стоимость
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Срок</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Предложенные сроки
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Портфолио</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Ссылки на работы
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="shortlist">Шорт-лист кандидатов</h2>

        <p>
          AI автоматически формирует шорт-лист лучших кандидатов на основе
          оценок. Вы можете:
        </p>

        <ul>
          <li>Просмотреть топ-10 кандидатов с наивысшими оценками</li>
          <li>Сравнить их предложения по цене и срокам</li>
          <li>Изучить портфолио и отзывы</li>
          <li>Пригласить на интервью одним кликом</li>
        </ul>

        <DocsCallout type="tip" title="Пересчет шорт-листа">
          Если вы изменили критерии отбора, можно пересчитать шорт-лист через
          API метод <code>gig.recalculateShortlist</code>.
        </DocsCallout>

        <h2 id="interview">AI-интервью</h2>

        <p>
          Для отобранных кандидатов можно сгенерировать уникальные ссылки на
          AI-интервью:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>Выберите кандидата из шорт-листа</li>
          <li>Нажмите «Пригласить на интервью»</li>
          <li>Система сгенерирует уникальную ссылку</li>
          <li>Отправьте ссылку кандидату через платформу</li>
          <li>AI проведет интервью и предоставит отчет</li>
        </ol>

        <DocsCallout type="info" title="Шаблоны приглашений">
          Используйте <code>gig.generateInvitationTemplate</code> для создания
          персонализированных приглашений на интервью.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/pipeline"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Воронка найма
          </Link>
          <Link
            href="/candidates/voice"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Голосовые сообщения
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
