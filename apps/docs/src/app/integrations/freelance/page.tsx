import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsSteps } from "@/components/docs/docs-steps";
import { DocsToc } from "@/components/docs/docs-toc";

export default function FreelancePlatformsPage() {
  const tocItems = [
    { id: "platforms", title: "Поддерживаемые платформы", level: 2 },
    { id: "how-it-works", title: "Как это работает", level: 2 },
    { id: "import-process", title: "Процесс импорта", level: 2 },
    { id: "gig-management", title: "Управление заданиями", level: 2 },
  ];

  const importSteps = [
    {
      title: "Создайте Gig-задание",
      content: (
        <p>
          Перейдите в раздел «Задания» и нажмите «Создать задание». Заполните
          название, описание, бюджет и требования.
        </p>
      ),
    },
    {
      title: "Опубликуйте на платформе",
      content: (
        <p>
          Опубликуйте задание на выбранной фриланс-платформе (Kwork и др.).
          Скопируйте ссылку на задание.
        </p>
      ),
    },
    {
      title: "Импортируйте отклики",
      content: (
        <p>
          В QBS Автонайм откройте задание, нажмите «Импорт откликов» и вставьте
          ссылку. Система автоматически загрузит все отклики.
        </p>
      ),
    },
    {
      title: "Просмотрите результаты",
      content: (
        <p>
          Каждый отклик будет проанализирован AI и получит оценку от 1 до 5
          звезд. Вы увидите предложенную цену, сроки и портфолио.
        </p>
      ),
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Интеграции", href: "/integrations" },
            { title: "Фриланс-платформы" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Фриланс-платформы</h1>

        <p className="text-lg">
          Импортируйте отклики фрилансеров с популярных платформ и автоматически
          оценивайте их с помощью AI.
        </p>

        <h2 id="platforms" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Поддерживаемые платформы</h2>

        <div className="my-6 grid gap-3">
          {[
            { name: "Kwork", description: "Популярная российская биржа услуг" },
            {
              name: "FL.ru",
              description: "Одна из старейших фриланс-бирж России",
            },
            {
              name: "Freelance.ru",
              description: "Платформа для поиска исполнителей",
            },
            {
              name: "Habr Freelance",
              description: "Биржа для IT-специалистов",
            },
          ].map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-3 rounded-lg border border-border p-4"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {platform.name[0]}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {platform.name}
                </span>
                <p className="text-sm text-muted-foreground">
                  {platform.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h2 id="how-it-works" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Как это работает</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">Система автоматически:</p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Парсит ссылку</strong> — определяет платформу и ID задания
          </li>
          <li>
            <strong className="font-semibold text-foreground">Извлекает данные</strong> — загружает информацию о всех
            откликах
          </li>
          <li>
            <strong className="font-semibold text-foreground">Анализирует профили</strong> — оценивает опыт, портфолио,
            рейтинг фрилансера
          </li>
          <li>
            <strong className="font-semibold text-foreground">Формирует оценку</strong> — AI выставляет балл от 1 до 5
            звезд
          </li>
          <li>
            <strong className="font-semibold text-foreground">Сохраняет в системе</strong> — все данные доступны в
            карточке задания
          </li>
        </ul>

        <DocsCallout type="info" title="Автоматическое обновление">
          После первого импорта система может периодически проверять новые
          отклики (настраивается в параметрах задания).
        </DocsCallout>

        <h2 id="import-process" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Процесс импорта</h2>

        <DocsSteps steps={importSteps} />

        <h2 id="gig-management" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Управление Gig-заданиями</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">В разделе «Задания» вы можете:</p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Просматривать отклики</strong> — список всех фрилансеров с
            оценками
          </li>
          <li>
            <strong className="font-semibold text-foreground">Фильтровать по оценке</strong> — показать только 4-5 звезд
          </li>
          <li>
            <strong className="font-semibold text-foreground">Сравнивать предложения</strong> — цена, сроки, опыт
          </li>
          <li>
            <strong className="font-semibold text-foreground">Проводить интервью</strong> — отправить ссылку на
            веб-интервью
          </li>
          <li>
            <strong className="font-semibold text-foreground">Принимать/отклонять</strong> — управлять статусами откликов
          </li>
        </ul>

        <DocsCallout type="tip" title="Совет">
          Используйте фильтр по бюджету, чтобы быстро найти фрилансеров, чьи
          ожидания соответствуют вашему бюджету.
        </DocsCallout>

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
                <td className="px-4 py-3 text-foreground">Предложенная цена</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Сколько фрилансер просит за работу
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Срок выполнения</td>
                <td className="px-4 py-3 text-muted-foreground">
                  За сколько дней обещает выполнить
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Портфолио</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Ссылки на предыдущие работы
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Рейтинг</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Оценка на платформе (если доступна)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">
                  Сопроводительное письмо
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Текст отклика фрилансера
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations/hh"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            hh.ru
          </Link>
          <Link
            href="/integrations/telegram"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Telegram
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
