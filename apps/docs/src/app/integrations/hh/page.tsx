import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCallout } from "@/components/docs-callout"
import { DocsSteps } from "@/components/docs-steps"
import { DocsToc } from "@/components/docs-toc"
import Link from "next/link"

export default function HHIntegrationPage() {
  const tocItems = [
    { id: "features", title: "Возможности", level: 2 },
    { id: "setup", title: "Настройка", level: 2 },
    { id: "sync-settings", title: "Параметры синхронизации", level: 2 },
    { id: "troubleshooting", title: "Решение проблем", level: 2 },
  ]

  const setupSteps = [
    {
      title: "Откройте настройки интеграций",
      content: <p>{"Перейдите в «Настройки» → «Интеграции» → «hh.ru»."}</p>,
    },
    {
      title: "Авторизуйтесь в hh.ru",
      content: (
        <p>{"Нажмите «Подключить» и войдите в ваш аккаунт работодателя на hh.ru. Разрешите доступ QBS Автонайм."}</p>
      ),
    },
    {
      title: "Выберите вакансии для синхронизации",
      content: <p>Укажите, какие вакансии с hh.ru должны синхронизироваться с QBS Автонайм.</p>,
    },
    {
      title: "Настройте параметры импорта",
      content: <p>Выберите частоту синхронизации и правила обработки новых откликов.</p>,
    },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции", href: "/integrations" }, { title: "hh.ru" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1>Интеграция с hh.ru</h1>

        <p className="text-lg">
          Подключите hh.ru для автоматического импорта откликов и публикации вакансий на крупнейшем job-сайте России.
        </p>

        <DocsCallout type="info" title="Требования">
          Для интеграции необходим аккаунт работодателя на hh.ru с активными вакансиями или балансом для публикации
          новых.
        </DocsCallout>

        <h2 id="features">Возможности интеграции</h2>

        <ul>
          <li>
            <strong>Импорт откликов</strong> — автоматическое получение новых откликов каждые 5-15 минут
          </li>
          <li>
            <strong>Синхронизация статусов</strong> — изменения в QBS Автонайм отражаются в hh.ru
          </li>
          <li>
            <strong>Публикация вакансий</strong> — создавайте вакансии в QBS и публикуйте на hh.ru в один клик
          </li>
          <li>
            <strong>Поиск резюме</strong> — доступ к базе резюме hh.ru из интерфейса QBS Автонайм
          </li>
          <li>
            <strong>Аналитика</strong> — статистика по вакансиям и откликам из hh.ru
          </li>
        </ul>

        <h2 id="setup">Настройка интеграции</h2>

        <DocsSteps steps={setupSteps} />

        <h2 id="sync-settings">Параметры синхронизации</h2>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Параметр</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Описание</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">По умолчанию</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground">Частота синхронизации</td>
                <td className="px-4 py-3 text-muted-foreground">Как часто проверять новые отклики</td>
                <td className="px-4 py-3 text-muted-foreground">15 минут</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Автоматический скрининг</td>
                <td className="px-4 py-3 text-muted-foreground">Запускать AI-скрининг для новых откликов</td>
                <td className="px-4 py-3 text-muted-foreground">Включено</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Синхронизация статусов</td>
                <td className="px-4 py-3 text-muted-foreground">Обновлять статус в hh.ru при изменении в QBS</td>
                <td className="px-4 py-3 text-muted-foreground">Включено</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Импорт архивных</td>
                <td className="px-4 py-3 text-muted-foreground">Импортировать отклики старше 7 дней</td>
                <td className="px-4 py-3 text-muted-foreground">Выключено</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="troubleshooting">Решение проблем</h2>

        <div className="my-6 flex flex-col gap-4">
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">Отклики не импортируются</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Проверьте, что вакансия на hh.ru активна и связана с вакансией в QBS Автонайм. Убедитесь, что токен
              доступа не истёк (переавторизуйтесь при необходимости).
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium text-foreground">Ошибка авторизации</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Отключите интеграцию и подключите заново. Убедитесь, что у вашего аккаунта на hh.ru есть права
              администратора.
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/integrations"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Обзор интеграций
          </Link>
          <Link
            href="/integrations/superjob"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            SuperJob
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
