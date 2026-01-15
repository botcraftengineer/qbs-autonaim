import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsSteps } from "@/components/docs/docs-steps";
import { DocsToc } from "@/components/docs/docs-toc";

export default function QuickstartPage() {
  const tocItems = [
    { id: "create-account", title: "Создание аккаунта", level: 2 },
    { id: "create-vacancy", title: "Создание вакансии", level: 2 },
    { id: "import-candidates", title: "Импорт кандидатов", level: 2 },
    { id: "next-steps", title: "Следующие шаги", level: 2 },
  ];

  const steps = [
    {
      title: "Зарегистрируйтесь в системе",
      content: (
        <div>
          <p className="mb-3">
            Перейдите на{" "}
            <Link href="https://app.qbs-autonaim.ru/signup">
              страницу регистрации
            </Link>{" "}
            и создайте аккаунт. Вы можете войти через корпоративную почту или
            использовать Google/Яндекс.
          </p>
          <p>
            После регистрации вы получите доступ к личному кабинету с пробным
            периодом на 14 дней.
          </p>
        </div>
      ),
    },
    {
      title: "Создайте первую вакансию",
      content: (
        <div>
          <p className="mb-3">
            В разделе «Вакансии» нажмите кнопку «Создать вакансию». Заполните
            название должности, описание требований и желаемые навыки.
          </p>
          <p>
            AI автоматически проанализирует описание и создаст критерии для
            скрининга кандидатов. Вы можете настроить их вручную.
          </p>
        </div>
      ),
    },
    {
      title: "Подключите источники кандидатов",
      content: (
        <div>
          <p className="mb-3">
            Перейдите в раздел «Интеграции» и подключите нужные источники:{" "}
            <Link href="/integrations/hh">hh.ru</Link>,{" "}
            <Link href="/integrations/superjob">SuperJob</Link> или загрузите
            резюме вручную.
          </p>
          <p>
            Кандидаты начнут автоматически поступать в систему и проходить
            AI-скрининг.
          </p>
        </div>
      ),
    },
    {
      title: "Настройте AI-ассистента",
      content: (
        <div>
          <p className="mb-3">
            В разделе «AI-ассистент» выберите шаблоны сообщений для
            автоматических ответов кандидатам. Настройте тон общения и временные
            интервалы.
          </p>
          <p>
            AI будет самостоятельно отвечать на типичные вопросы и назначать
            собеседования согласно вашему календарю.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Начало работы", href: "/docs" },
            { title: "Быстрый старт" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Начало работы
          </span>
        </div>

        <h1>Быстрый старт</h1>

        <p className="text-lg">
          Начните работу с QBS Автонайм за несколько минут. Это руководство
          проведёт вас через основные шаги настройки системы.
        </p>

        <DocsMobileToc items={tocItems} />

        <DocsCallout type="tip" title="Пробный период">
          Все новые пользователи получают бесплатный 14-дневный пробный период с
          полным доступом ко всем функциям платформы.
        </DocsCallout>

        <h2 id="create-account">Создание аккаунта</h2>

        <p>
          Для начала работы вам потребуется создать аккаунт в QBS Автонайм.
          Процесс регистрации занимает менее минуты.
        </p>

        <h2 id="steps">Пошаговая настройка</h2>

        <DocsSteps steps={steps} />

        <h2 id="next-steps">Следующие шаги</h2>

        <p>
          После завершения базовой настройки рекомендуем изучить следующие
          разделы:
        </p>

        <ul>
          <li>
            <Link href="/candidates/screening">AI-скрининг</Link> — узнайте, как
            настроить критерии отбора кандидатов
          </li>
          <li>
            <Link href="/candidates/scoring">Скоринг кандидатов</Link> —
            настройте веса для автоматической оценки
          </li>
          <li>
            <Link href="/ai-assistant/templates">Шаблоны сообщений</Link> —
            создайте персонализированные ответы
          </li>
          <li>
            <Link href="/analytics">Аналитика</Link> — отслеживайте
            эффективность найма
          </li>
        </ul>

        <DocsCallout type="info" title="Нужна помощь?">
          Если у вас возникли вопросы, обратитесь в нашу службу поддержки через
          чат в личном кабинете или напишите на support@qbs-autonaim.ru
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/docs"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Введение
          </Link>
          <Link
            href="/glossary"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Глоссарий
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
