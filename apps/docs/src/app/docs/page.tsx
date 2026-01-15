import { DocsBreadcrumb } from "@/components/docs-breadcrumb"
import { DocsCard } from "@/components/docs-card"
import { DocsToc } from "@/components/docs-toc"
import { DocsFeedback } from "@/components/docs-feedback"
import { DocsMobileToc } from "@/components/docs-mobile-toc"
import { Users, Bot, Plug, Zap, FileText } from "lucide-react"
import Link from "next/link"

export default function DocsIntroductionPage() {
  const tocItems = [
    { id: "key-features", title: "Ключевые возможности", level: 2 },
    { id: "getting-started", title: "С чего начать", level: 2 },
    { id: "stay-updated", title: "Будьте в курсе", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        {/* Hero-раздел */}
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            Начало работы
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Добро пожаловать в QBS Автонайм</h1>
          <p className="text-xl text-muted-foreground">
            Современная AI-платформа для автоматизации рекрутинга. Экономьте время на скрининге кандидатов и находите
            лучших специалистов быстрее.
          </p>
        </div>

        <DocsMobileToc items={tocItems} />

        <DocsBreadcrumb items={[{ title: "Начало работы" }, { title: "Введение" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Начало работы</span>
        </div>

        <h1>Введение</h1>

        <p className="text-lg">
          <strong>QBS Автонайм</strong> — это современная AI-платформа для рекрутеров, которая помогает{" "}
          <Link href="/candidates/screening">автоматизировать скрининг кандидатов</Link>,{" "}
          <Link href="/analytics">отслеживать аналитику найма</Link> и{" "}
          <Link href="/ai-assistant">общаться с кандидатами через AI-ассистента</Link>.
        </p>

        <p>Если вы:</p>

        <ul>
          <li>
            <strong>Рекрутер</strong>, который хочет сократить время на обработку резюме
          </li>
          <li>
            <strong>HR-менеджер</strong>, которому нужна полная картина воронки найма
          </li>
          <li>
            <strong>Руководитель</strong>, который хочет{" "}
            <Link href="/analytics/metrics">измерять эффективность</Link> процесса найма
          </li>
          <li>
            <strong>Разработчик</strong>, которому нужно <Link href="/api">интегрировать данные о кандидатах</Link>{" "}
            в свою систему
          </li>
        </ul>

        <p>QBS Автонайм поможет вам достичь ваших целей.</p>

        <h2 id="key-features">Ключевые возможности</h2>

        <p>
          QBS Автонайм — это не просто база данных кандидатов. Мы предлагаем полный набор инструментов для автоматизации
          и оптимизации процесса найма.
        </p>

        <p>Вот основные функции, которые предлагает QBS Автонайм:</p>

        <ul>
          <li>
            <Link href="/candidates/screening">AI-скрининг резюме</Link> (включая{" "}
            <Link href="/integrations/hh">массовый импорт с hh.ru</Link>)
          </li>
          <li>
            <Link href="/candidates/scoring">Автоматический скоринг кандидатов</Link>
          </li>
          <li>
            <Link href="/ai-assistant/chat">Чат-бот для коммуникации с кандидатами</Link>
          </li>
          <li>
            <Link href="/candidates/pipeline">Управление воронкой найма</Link>
          </li>
          <li>
            <Link href="/analytics">Аналитика и отчёты</Link>
          </li>
          <li>
            <Link href="/integrations">Интеграции</Link> + <Link href="/integrations/webhooks">Webhooks</Link>
          </li>
          <li>
            <Link href="/api">REST API</Link> для разработчиков
          </li>
        </ul>

        <h2 id="getting-started">С чего начать</h2>

        <p>Выберите подходящий для вас путь, чтобы начать работу с QBS Автонайм:</p>

        <div className="grid gap-4 sm:grid-cols-2 my-6">
          <DocsCard
            title="Быстрый старт"
            description="Настройте первую вакансию и начните получать кандидатов за 5 минут"
            href="/quickstart"
            icon={<Zap className="h-5 w-5" />}
          />
          <DocsCard
            title="AI-скрининг"
            description="Узнайте, как AI автоматически оценивает резюме кандидатов"
            href="/candidates/screening"
            icon={<Users className="h-5 w-5" />}
          />
          <DocsCard
            title="Интеграции"
            description="Подключите hh.ru, SuperJob, Telegram и другие сервисы"
            href="/integrations"
            icon={<Plug className="h-5 w-5" />}
          />
          <DocsCard
            title="API для разработчиков"
            description="Интегрируйте QBS Автонайм в вашу систему через REST API"
            href="/api"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        <h2 id="stay-updated">Будьте в курсе</h2>

        <div className="grid gap-4 sm:grid-cols-2 my-6">
          <DocsCard
            title="Блог"
            description="Узнавайте о новых функциях и лучших практиках найма"
            href="https://qbs-autonaim.ru/blog"
            icon={<FileText className="h-5 w-5" />}
          />
          <DocsCard
            title="Telegram-канал"
            description="Подпишитесь на наш канал для получения новостей и обновлений"
            href="https://t.me/qbs_autonaim"
            icon={<Bot className="h-5 w-5" />}
          />
        </div>

        {/* Компонент обратной связи */}
        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <div />
          <Link
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Быстрый старт
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
