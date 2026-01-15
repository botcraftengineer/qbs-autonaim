import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsSteps } from "@/components/docs/docs-steps";
import { DocsToc } from "@/components/docs/docs-toc";

export default function HHIntegrationPage() {
  const tocItems = [
    { id: "features", title: "Возможности", level: 2 },
    { id: "setup", title: "Настройка", level: 2 },
    { id: "sync-settings", title: "Параметры синхронизации", level: 2 },
    { id: "troubleshooting", title: "Решение проблем", level: 2 },
  ];

  const setupSteps = [
    {
      title: "Откройте настройки интеграций",
      content: <p className="leading-relaxed text-foreground/80 mb-4">{"Перейдите в «Настройки» → «Интеграции» → «hh.ru»."}</p>,
    },
    {
      title: "Авторизуйтесь в hh.ru",
      content: (
        <p>
          {
            "Нажмите «Подключить» и войдите в ваш аккаунт работодателя на hh.ru. Разрешите доступ QBS Автонайм."
          }
        </p>
      ),
    },
    {
      title: "Выберите вакансии для синхронизации",
      content: (
        <p>
          Укажите, какие вакансии с hh.ru должны синхронизироваться с QBS
          Автонайм.
        </p>
      ),
    },
    {
      title: "Настройте параметры импорта",
      content: (
        <p>
          Выберите частоту синхронизации и правила обработки новых откликов.
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
            { title: "hh.ru" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Интеграция с hh.ru</h1>

        <p className="text-lg">
          Подключите hh.ru для автоматического импорта откликов и публикации
          вакансий на крупнейшем job-сайте России.
        </p>

        <DocsCallout type="info" title="Требования">
          Для интеграции необходим аккаунт работодателя на hh.ru с активными
          вакансиями или балансом для публикации новых.
        </DocsCallout>

        <h2 id="features" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Возможности интеграции</h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Парсинг вакансий</strong> — автоматическое получение ваших
            вакансий с HH.ru
          </li>
          <li>
            <strong className="font-semibold text-foreground">Импорт откликов</strong> — загрузка всех откликов на
            вакансии
          </li>
          <li>
            <strong className="font-semibold text-foreground">Извлечение данных</strong> — парсинг резюме, контактов,
            опыта работы
          </li>
          <li>
            <strong className="font-semibold text-foreground">Автоматический скрининг</strong> — AI оценивает каждый
            отклик от 1 до 5 звезд
          </li>
          <li>
            <strong className="font-semibold text-foreground">Сохранение сессий</strong> — не нужно авторизовываться
            каждый раз
          </li>
        </ul>

        <DocsCallout type="warning" title="Ограничения">
          Интеграция работает через парсинг веб-интерфейса HH.ru. Публикация
          вакансий и отправка сообщений кандидатам пока не поддерживаются.
        </DocsCallout>

        <h2 id="setup" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Настройка интеграции</h2>

        <DocsSteps steps={setupSteps} />

        {/* PLACEHOLDER: Скриншот настройки интеграции HH.ru */}
        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">📸 Скриншот: Подключение HH.ru</p>
          <p className="text-xs text-muted-foreground">
            Показать страницу интеграций с кнопкой "Подключить HH.ru" и формой авторизации
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/workspaces/[slug]/settings/integrations
          </p>
        </div>

        <h2 id="sync-settings" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Параметры синхронизации</h2>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Параметр
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Описание
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  По умолчанию
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground">
                  Частота синхронизации
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Как часто проверять новые отклики
                </td>
                <td className="px-4 py-3 text-muted-foreground">15 минут</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">
                  Автоматический скрининг
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Запускать AI-скрининг для новых откликов
                </td>
                <td className="px-4 py-3 text-muted-foreground">Включено</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">
                  Синхронизация статусов
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Обновлять статус в hh.ru при изменении в QBS
                </td>
                <td className="px-4 py-3 text-muted-foreground">Включено</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Импорт архивных</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Импортировать отклики старше 7 дней
                </td>
                <td className="px-4 py-3 text-muted-foreground">Выключено</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="troubleshooting" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Решение проблем</h2>

        <div className="my-6 flex flex-col gap-4">
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">
              Отклики не импортируются
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              Проверьте, что вакансия на hh.ru активна и связана с вакансией в
              QBS Автонайм. Убедитесь, что токен доступа не истёк
              (переавторизуйтесь при необходимости).
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">Ошибка авторизации</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Отключите интеграцию и подключите заново. Убедитесь, что у вашего
              аккаунта на hh.ru есть права администратора.
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Обзор интеграций
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
