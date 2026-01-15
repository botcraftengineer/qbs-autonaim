import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsCallout } from "@/components/docs/docs-callout"
import { DocsToc } from "@/components/docs/docs-toc"
import { DocsCode } from "@/components/docs/docs-code"
import Link from "next/link"

export default function TemplatesPage() {
  const tocItems = [
    { id: "template-types", title: "Типы шаблонов", level: 2 },
    { id: "creating-templates", title: "Создание шаблонов", level: 2 },
    { id: "examples", title: "Примеры шаблонов", level: 2 },
    { id: "best-practices", title: "Лучшие практики", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[{ title: "AI-ассистент", href: "/ai-assistant" }, { title: "Шаблоны сообщений" }]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">AI-ассистент</span>
        </div>

        <h1>Шаблоны сообщений</h1>

        <p className="text-lg">
          Шаблоны сообщений позволяют стандартизировать коммуникацию с кандидатами и экономить время на написании
          типовых писем.
        </p>

        <h2 id="template-types">Типы шаблонов</h2>

        <ul>
          <li>
            <strong>Приветственные</strong> — первое сообщение кандидату после отклика
          </li>
          <li>
            <strong>Приглашения</strong> — приглашение на собеседование или следующий этап
          </li>
          <li>
            <strong>Напоминания</strong> — напоминание о предстоящем собеседовании
          </li>
          <li>
            <strong>Отказы</strong> — вежливый отказ с обратной связью
          </li>
          <li>
            <strong>Офферы</strong> — предложение о работе
          </li>
          <li>
            <strong>Follow-up</strong> — повторное обращение к кандидату
          </li>
        </ul>

        <h2 id="creating-templates">Создание шаблонов</h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>{"Перейдите в раздел «AI-ассистент» → «Шаблоны»"}</li>
          <li>{"Нажмите «Создать шаблон»"}</li>
          <li>Выберите тип шаблона и канал (email, Telegram, SMS)</li>
          <li>Напишите текст сообщения с использованием переменных</li>
          <li>Сохраните шаблон</li>
        </ol>

        <DocsCallout type="tip" title="Совет">
          Создавайте несколько вариантов одного шаблона с разным тоном — формальный для крупных компаний и неформальный
          для стартапов.
        </DocsCallout>

        <h2 id="examples">Примеры шаблонов</h2>

        <h3>Приглашение на собеседование</h3>

        <DocsCode
          title="invite_interview.txt"
          language="text"
          code={`Здравствуйте, {{candidate.name}}!

Благодарим за интерес к позиции {{vacancy.title}} в {{company.name}}.

Мы изучили ваше резюме и хотели бы пригласить вас на собеседование.

Предлагаем встретиться {{interview.date}} в {{interview.time}}.
Формат: {{interview.format}}

Пожалуйста, подтвердите своё участие или предложите альтернативное время.

С уважением,
{{recruiter.name}}
{{company.name}}`}
        />

        <h3>Отказ с обратной связью</h3>

        <DocsCode
          title="rejection.txt"
          language="text"
          code={`Здравствуйте, {{candidate.name}}!

Благодарим вас за интерес к позиции {{vacancy.title}} и время, 
уделённое нашему процессу отбора.

К сожалению, мы приняли решение продолжить с другими кандидатами, 
чей опыт более точно соответствует текущим требованиям.

Мы сохраним ваше резюме в нашей базе и свяжемся с вами, 
если появятся подходящие возможности.

Желаем успехов в поиске работы!

С уважением,
{{recruiter.name}}`}
        />

        <h2 id="best-practices">Лучшие практики</h2>

        <ul>
          <li>
            <strong>Персонализируйте</strong> — всегда используйте имя кандидата и название вакансии
          </li>
          <li>
            <strong>Будьте конкретны</strong> — указывайте точные даты, время, адрес
          </li>
          <li>
            <strong>Добавляйте CTA</strong> — чётко объясняйте, что должен сделать кандидат
          </li>
          <li>
            <strong>Проверяйте тон</strong> — убедитесь, что тон соответствует культуре компании
          </li>
          <li>
            <strong>Тестируйте</strong> — отправляйте тестовые сообщения себе перед использованием
          </li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/ai-assistant/auto-replies"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Автоответы
          </Link>
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аналитика
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
