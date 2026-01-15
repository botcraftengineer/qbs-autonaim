import { Briefcase, Code2, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCard } from "@/components/docs/docs-card";
import { DocsToc } from "@/components/docs/docs-toc";

export default function IntegrationsPage() {
  const tocItems = [
    { id: "available-integrations", title: "Доступные интеграции", level: 2 },
    { id: "job-sites", title: "Job-сайты", level: 3 },
    { id: "messengers", title: "Мессенджеры", level: 3 },
    { id: "developers", title: "Разработчикам", level: 3 },
    { id: "setup", title: "Настройка интеграций", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Интеграции" }, { title: "Обзор" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Интеграции</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Интеграции
        </h1>

        <p className="text-lg">
          QBS Автонайм интегрируется с популярными job-сайтами, мессенджерами и
          HR-системами для автоматизации потока кандидатов.
        </p>

        <h2
          id="available-integrations"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Доступные интеграции
        </h2>

        <h3 id="job-sites" className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Job-сайты и фриланс-платформы
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 my-4">
          <DocsCard
            title="hh.ru"
            description="Автоматический парсинг вакансий и откликов с крупнейшего job-сайта России."
            href="/integrations/hh"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <DocsCard
            title="Фриланс-платформы"
            description="Импорт откликов с Kwork, FL.ru, Freelance.ru, Habr Freelance."
            href="/integrations/freelance"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <h3 id="messengers" className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Мессенджеры
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 my-4">
          <DocsCard
            title="Telegram"
            description="AI-интервью через Telegram-бота, автоматические диалоги с кандидатами."
            href="/integrations/telegram"
            icon={<MessageCircle className="h-5 w-5" />}
          />
        </div>

        <h3 id="developers" className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          Разработчикам
        </h3>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Для интеграции с корпоративными системами и API других сервисов
          обратитесь к нашей службе поддержки.
        </p>

        <h2
          id="setup"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Настройка интеграций
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Для подключения интеграции:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            {"Перейдите в «Настройки» → «Интеграции»"}
          </li>
          <li className="text-foreground/80">
            Найдите нужную интеграцию и нажмите «Подключить»
          </li>
          <li className="text-foreground/80">
            Следуйте инструкциям для авторизации
          </li>
          <li className="text-foreground/80">
            Настройте параметры синхронизации
          </li>
        </ol>

        <DocsCallout type="info" title="Безопасность">
          Все интеграции используют безопасные протоколы авторизации. Ваши
          учётные данные от внешних сервисов надёжно защищены.
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
            href="/integrations/hh"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            hh.ru
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
