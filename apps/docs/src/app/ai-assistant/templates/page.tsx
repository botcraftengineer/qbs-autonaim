import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function TemplatesPage() {
  const tocItems = [
    { id: "template-types", title: "Типы шаблонов", level: 2 },
    { id: "creating-templates", title: "Создание шаблонов", level: 2 },
    { id: "examples", title: "Примеры шаблонов", level: 2 },
    { id: "best-practices", title: "Лучшие практики", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "AI-ассистент", href: "/ai-assistant" },
            { title: "Шаблоны сообщений" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">AI-ассистент</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Шаблоны сообщений
        </h1>

        <p className="text-lg">
          Шаблоны сообщений позволяют стандартизировать коммуникацию с
          кандидатами и экономить время на написании типовых писем.
        </p>

        <h2
          id="template-types"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Типы шаблонов
        </h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Приветственные
            </strong>{" "}
            — первое сообщение кандидату после отклика
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Приглашения
            </strong>{" "}
            — приглашение на собеседование или следующий этап
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Напоминания
            </strong>{" "}
            — напоминание о предстоящем собеседовании
          </li>
          <li>
            <strong className="font-semibold text-foreground">Отказы</strong> —
            вежливый отказ с обратной связью
          </li>
          <li>
            <strong className="font-semibold text-foreground">Офферы</strong> —
            предложение о работе
          </li>
          <li>
            <strong className="font-semibold text-foreground">Follow-up</strong>{" "}
            — повторное обращение к кандидату
          </li>
        </ul>

        <h2
          id="creating-templates"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Создание шаблонов
        </h2>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            {"Перейдите в раздел «AI-ассистент» → «Шаблоны»"}
          </li>
          <li className="text-foreground/80">{"Нажмите «Создать шаблон»"}</li>
          <li className="text-foreground/80">
            Выберите тип шаблона и канал (email, Telegram, SMS)
          </li>
          <li className="text-foreground/80">
            Напишите текст сообщения с использованием переменных
          </li>
          <li className="text-foreground/80">Сохраните шаблон</li>
        </ol>

        <DocsCallout type="tip" title="Совет">
          Создавайте несколько вариантов одного шаблона с разным тоном —
          формальный для крупных компаний и неформальный для стартапов.
        </DocsCallout>

        <h2
          id="examples"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Примеры шаблонов
        </h2>

        <h3 className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20">
          Приглашение на собеседование
        </h3>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <p className="text-sm whitespace-pre-line">
            Здравствуйте, [Имя кандидата]!
            <br />
            <br />
            Благодарим за интерес к позиции [Название вакансии] в [Название
            компании].
            <br />
            <br />
            Мы изучили ваше резюме и хотели бы пригласить вас на собеседование.
            <br />
            <br />
            Предлагаем встретиться [Дата] в [Время].
            <br />
            Формат: [Формат интервью]
            <br />
            <br />
            Пожалуйста, подтвердите своё участие или предложите альтернативное
            время.
            <br />
            <br />С уважением,
            <br />
            [Имя рекрутера]
            <br />
            [Название компании]
          </p>
        </div>

        <h3 className="text-lg font-semibold text-foreground mt-8 mb-3 scroll-mt-20">
          Отказ с обратной связью
        </h3>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <p className="text-sm whitespace-pre-line">
            Здравствуйте, [Имя кандидата]!
            <br />
            <br />
            Благодарим вас за интерес к позиции [Название вакансии] и время,
            уделённое нашему процессу отбора.
            <br />
            <br />К сожалению, мы приняли решение продолжить с другими
            кандидатами, чей опыт более точно соответствует текущим требованиям.
            <br />
            <br />
            Мы сохраним ваше резюме в нашей базе и свяжемся с вами, если
            появятся подходящие возможности.
            <br />
            <br />
            Желаем успехов в поиске работы!
            <br />
            <br />С уважением,
            <br />
            [Имя рекрутера]
          </p>
        </div>

        <h2
          id="best-practices"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Лучшие практики
        </h2>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Персонализируйте
            </strong>{" "}
            — всегда используйте имя кандидата и название вакансии
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Будьте конкретны
            </strong>{" "}
            — указывайте точные даты, время, адрес
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Добавляйте CTA
            </strong>{" "}
            — чётко объясняйте, что должен сделать кандидат
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Проверяйте тон
            </strong>{" "}
            — убедитесь, что тон соответствует культуре компании
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Тестируйте
            </strong>{" "}
            — отправляйте тестовые сообщения себе перед использованием
          </li>
        </ul>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/ai-assistant/auto-replies"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Автоответы
          </Link>
          <Link
            href="/analytics"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Аналитика
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
