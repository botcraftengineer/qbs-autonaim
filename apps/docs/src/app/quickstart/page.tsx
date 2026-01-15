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
            Перейдите на страницу регистрации и создайте аккаунт. Вы можете
            войти через корпоративную почту.
          </p>
          <p>
            После регистрации создайте организацию и workspace для вашей
            команды.
          </p>
        </div>
      ),
    },
    {
      title: "Подключите HeadHunter",
      content: (
        <div>
          <p className="mb-3">
            В разделе «Интеграции» подключите ваш аккаунт работодателя на HH.ru.
            Введите email и пароль — данные хранятся в зашифрованном виде.
          </p>
          <p>Система автоматически загрузит все ваши вакансии и отклики.</p>
        </div>
      ),
    },
    {
      title: "Настройте AI-интервью",
      content: (
        <div>
          <p className="mb-3">
            Откройте любую вакансию и перейдите в «Настройки интервью». Укажите
            организационные и технические вопросы, которые будет задавать бот.
          </p>
          <p>Сгенерируйте ссылку на интервью и отправьте её кандидатам.</p>
        </div>
      ),
    },
    {
      title: "Просмотрите результаты",
      content: (
        <div>
          <p className="mb-3">
            Все отклики автоматически проходят AI-скрининг и получают оценку от
            1 до 5 звезд. Просмотрите результаты в разделе «Отклики».
          </p>
          <p>Используйте фильтры, чтобы найти лучших кандидатов быстрее.</p>
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
            <Link href="/candidates/screening">AI-скрининг</Link> — как работает
            автоматическая оценка резюме
          </li>
          <li>
            <Link href="/ai-assistant/chat">AI-интервью</Link> — настройка
            автоматических интервью
          </li>
          <li>
            <Link href="/integrations/freelance">Фриланс-платформы</Link> —
            импорт откликов с Kwork и др.
          </li>
          <li>
            <Link href="/integrations/telegram">Telegram-бот</Link> — проведение
            интервью в мессенджере
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
