import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCode } from "@/components/docs/docs-code";
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
      <article className="docs-content flex-1 max-w-3xl">
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

        <h1>Голосовые сообщения</h1>

        <p className="text-lg">
          Кандидаты могут отвечать на вопросы AI-интервью голосовыми
          сообщениями. Система автоматически транскрибирует аудио в текст и
          анализирует ответы.
        </p>

        <h2 id="overview">Голосовые сообщения</h2>

        <p>
          Поддержка голосовых сообщений делает интервью более удобным для
          кандидатов:
        </p>

        <ul>
          <li>
            <strong>Естественное общение</strong> — кандидат может говорить
            вместо набора текста
          </li>
          <li>
            <strong>Экономия времени</strong> — голосом отвечать быстрее
          </li>
          <li>
            <strong>Оценка коммуникации</strong> — AI анализирует манеру речи
          </li>
          <li>
            <strong>Доступность</strong> — удобно для мобильных устройств
          </li>
        </ul>

        <DocsCallout type="info" title="Поддерживаемые форматы">
          Система принимает голосовые сообщения в форматах: OGG, MP3, WAV, M4A.
          Максимальная длительность — 5 минут.
        </DocsCallout>

        <h2 id="transcription">Транскрибация</h2>

        <p>
          Для преобразования голоса в текст используется OpenAI Whisper — одна
          из лучших моделей распознавания речи:
        </p>

        <ul>
          <li>
            <strong>Высокая точность</strong> — распознает речь с акцентом и
            шумом
          </li>
          <li>
            <strong>Многоязычность</strong> — поддержка русского и английского
          </li>
          <li>
            <strong>Автоматическая пунктуация</strong> — текст готов к анализу
          </li>
          <li>
            <strong>Быстрая обработка</strong> — транскрибация за несколько
            секунд
          </li>
        </ul>

        <DocsCode
          title="Процесс обработки голосового сообщения"
          language="typescript"
          code={`// 1. Кандидат отправляет голосовое сообщение
const voiceMessage = await telegram.getFile(message.voice.file_id);

// 2. Система скачивает аудио
const audioBuffer = await downloadFile(voiceMessage.file_path);

// 3. Whisper транскрибирует в текст
const transcription = await openai.audio.transcriptions.create({
  file: audioBuffer,
  model: "whisper-1",
  language: "ru"
});

// 4. AI анализирует текст ответа
const analysis = await analyzeResponse(transcription.text);`}
        />

        <h2 id="telegram">Telegram-интервью</h2>

        <p>
          В Telegram-боте кандидаты могут отвечать как текстом, так и голосом:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li>AI задает вопрос в текстовом виде</li>
          <li>Кандидат может ответить текстом или голосовым сообщением</li>
          <li>Если отправлен голос — система транскрибирует его</li>
          <li>AI анализирует ответ и задает следующий вопрос</li>
          <li>В конце интервью формируется полный отчет</li>
        </ol>

        <DocsCallout type="tip" title="Смешанный формат">
          Кандидат может комбинировать текстовые и голосовые ответы в одном
          интервью. Система обрабатывает оба формата одинаково.
        </DocsCallout>

        <h2 id="analysis">Анализ ответов</h2>

        <p>
          AI анализирует транскрибированные голосовые ответы так же, как
          текстовые:
        </p>

        <ul>
          <li>
            <strong>Релевантность</strong> — соответствие ответа вопросу
          </li>
          <li>
            <strong>Полнота</strong> — насколько детально кандидат ответил
          </li>
          <li>
            <strong>Компетентность</strong> — демонстрация знаний и опыта
          </li>
          <li>
            <strong>Коммуникация</strong> — ясность и структурированность речи
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
