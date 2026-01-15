import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCard } from "@/components/docs/docs-card"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCallout } from "@/components/docs/docs-callout"
import { MessageSquare, Reply, FileText } from "lucide-react"
import Link from "next/link"

export default function AIAssistantPage() {
  const tocItems = [
    { id: "capabilities", title: "Возможности", level: 2 },
    { id: "how-it-works", title: "Как это работает", level: 2 },
    { id: "sections", title: "Разделы", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "AI-ассистент" }, { title: "Обзор" }]} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">AI-ассистент</span>
        </div>

        <h1>AI-ассистент</h1>

        <p className="text-lg">
          AI-ассистент QBS Автонайм — это интеллектуальный помощник, который автоматизирует коммуникацию с кандидатами,
          отвечает на типичные вопросы и помогает назначать собеседования.
        </p>

        <DocsCallout type="tip" title="Доступность 24/7">
          AI-ассистент работает круглосуточно и отвечает кандидатам в течение нескольких секунд, что значительно
          повышает их вовлечённость и лояльность.
        </DocsCallout>

        <h2 id="capabilities">Возможности AI-ассистента</h2>

        <ul>
          <li>
            <strong>Автоматические ответы</strong> — мгновенные ответы на типичные вопросы кандидатов
          </li>
          <li>
            <strong>Назначение собеседований</strong> — интеграция с календарём для автоматического бронирования
          </li>
          <li>
            <strong>Сбор информации</strong> — уточнение деталей у кандидатов по заданному сценарию
          </li>
          <li>
            <strong>Напоминания</strong> — автоматические напоминания о собеседованиях
          </li>
          <li>
            <strong>Мультиканальность</strong> — работа через email, Telegram, WhatsApp
          </li>
          <li>
            <strong>Персонализация</strong> — использование данных кандидата для персонализированных сообщений
          </li>
        </ul>

        <h2 id="how-it-works">Как это работает</h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>
            <strong>Входящее сообщение</strong> — кандидат пишет в чат или отвечает на email
          </li>
          <li>
            <strong>Анализ намерения</strong> — AI определяет, что хочет узнать кандидат
          </li>
          <li>
            <strong>Поиск ответа</strong> — система ищет подходящий ответ в базе знаний и шаблонах
          </li>
          <li>
            <strong>Генерация ответа</strong> — AI формирует персонализированный ответ
          </li>
          <li>
            <strong>Отправка</strong> — сообщение отправляется кандидату
          </li>
          <li>
            <strong>Логирование</strong> — вся переписка сохраняется в карточке кандидата
          </li>
        </ol>

        <DocsCallout type="info" title="Контроль человека">
          Вы можете в любой момент взять диалог под ручное управление. AI приостановит автоответы для этого кандидата до
          тех пор, пока вы не вернёте автоматический режим.
        </DocsCallout>

        <h2 id="sections">Разделы</h2>

        <div className="grid gap-4 sm:grid-cols-1 my-6">
          <DocsCard
            title="Чат с кандидатами"
            description="Настройка и использование чата для коммуникации с кандидатами в реальном времени."
            href="/ai-assistant/chat"
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <DocsCard
            title="Автоответы"
            description="Настройка автоматических ответов на типичные вопросы кандидатов."
            href="/ai-assistant/auto-replies"
            icon={<Reply className="h-5 w-5" />}
          />
          <DocsCard
            title="Шаблоны сообщений"
            description="Создание и управление шаблонами для различных сценариев коммуникации."
            href="/ai-assistant/templates"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/pipeline"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Воронка найма
          </Link>
          <Link
            href="/ai-assistant/chat"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Чат с кандидатами
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
