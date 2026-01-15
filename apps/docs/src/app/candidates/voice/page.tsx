import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function VoicePage() {
  const tocItems = [
    { id: "overview", title: "Голосовые сообщения", level: 2 },
    { id: "transcription", title: "Транскрибация", level: 2 },
    { id: "telegram", title: "Telegram-интервью", level: 2 },
    { id: "analysis", title: "Анализ ответов", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Работа с кандидатами", href: "/candidates" },
            { title: "Голосовые сообщения" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Голосовые сообщения
        </h1>

        <p className="text-lg">
          Кандидаты могут отвечать на вопросы AI-интервью голосовыми
          сообщениями. Система автоматически транскрибирует аудио в текст и
          анализирует ответы.
        </p>

        <h2
          id="overview"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Голосовые сообщения
        </h2>

        <p>
          Поддержка голосовых сообщений делает интервью более удобным для
          кандидатов:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Естественное общение
            </strong>{" "}
            — кандидат может говорить вместо набора текста
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Экономия времени
            </strong>{" "}
            — голосом отвечать быстрее
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Оценка коммуникации
            </strong>{" "}
            — AI анализирует манеру речи
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Доступность
            </strong>{" "}
            — удобно для мобильных устройств
          </li>
        </ul>

        <DocsCallout type="info" title="Поддерживаемые форматы">
          Система принимает голосовые сообщения в форматах: OGG, MP3, WAV, M4A.
          Максимальная длительность — 5 минут.
        </DocsCallout>

        <h2
          id="transcription"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Транскрибация
        </h2>

        <p>
          Для преобразования голоса в текст используется OpenAI Whisper — одна
          из лучших моделей распознавания речи:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Высокая точность
            </strong>{" "}
            — распознает речь с акцентом и шумом
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Многоязычность
            </strong>{" "}
            — поддержка русского и английского
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Автоматическая пунктуация
            </strong>{" "}
            — текст готов к анализу
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Быстрая обработка
            </strong>{" "}
            — транскрибация за несколько секунд
          </li>
        </ul>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <p className="font-semibold text-foreground mb-3">
            Процесс обработки голосового сообщения:
          </p>
          <ol className="ml-6 list-decimal space-y-2 text-sm">
            <li>
              Кандидат отправляет голосовое сообщение через Telegram или
              веб-интерфейс
            </li>
            <li>Система автоматически скачивает аудиофайл</li>
            <li>AI транскрибирует голос в текст на русском языке</li>
            <li>Текст анализируется и оценивается по критериям вакансии</li>
            <li>Результат сохраняется в профиле кандидата</li>
          </ol>
        </div>
        <h2
          id="telegram"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Telegram-интервью
        </h2>

        <p>
          В Telegram-боте кандидаты могут отвечать как текстом, так и голосом:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            AI задает вопрос в текстовом виде
          </li>
          <li className="text-foreground/80">
            Кандидат может ответить текстом или голосовым сообщением
          </li>
          <li className="text-foreground/80">
            Если отправлен голос — система транскрибирует его
          </li>
          <li className="text-foreground/80">
            AI анализирует ответ и задает следующий вопрос
          </li>
          <li className="text-foreground/80">
            В конце интервью формируется полный отчет
          </li>
        </ol>

        <DocsCallout type="tip" title="Смешанный формат">
          Кандидат может комбинировать текстовые и голосовые ответы в одном
          интервью. Система обрабатывает оба формата одинаково.
        </DocsCallout>

        <h2
          id="analysis"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Анализ ответов
        </h2>

        <p>
          AI анализирует транскрибированные голосовые ответы так же, как
          текстовые:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Релевантность
            </strong>{" "}
            — соответствие ответа вопросу
          </li>
          <li>
            <strong className="font-semibold text-foreground">Полнота</strong> —
            насколько детально кандидат ответил
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Компетентность
            </strong>{" "}
            — демонстрация знаний и опыта
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Коммуникация
            </strong>{" "}
            — ясность и структурированность речи
          </li>
        </ul>

        <p>
          В отчете по интервью указывается, какие ответы были голосовыми, и
          приводится их транскрипция.
        </p>

        <DocsCallout type="info" title="Хранение аудио">
          Оригинальные аудиофайлы хранятся 30 дней для возможности повторного
          прослушивания. Транскрипции сохраняются постоянно.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/gig"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Gig-задания
          </Link>
          <Link
            href="/ai-assistant"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            AI-ассистент
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
