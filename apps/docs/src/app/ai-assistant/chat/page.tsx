import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function ChatPage() {
  const tocItems = [
    { id: "chat-interface", title: "Интерфейс чата", level: 2 },
    { id: "channels", title: "Каналы коммуникации", level: 2 },
    { id: "ai-mode", title: "Режим AI", level: 2 },
    { id: "manual-mode", title: "Ручной режим", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "AI-ассистент", href: "/ai-assistant" },
            { title: "Чат с кандидатами" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">AI-ассистент</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">AI-интервью с кандидатами</h1>

        <p className="text-lg">
          Автоматическое проведение интервью через Telegram и веб-интерфейс. AI
          задает вопросы, анализирует ответы и формирует оценку кандидата.
        </p>

        <h2 id="chat-interface" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Как это работает</h2>

        <p className="leading-relaxed text-foreground/80 mb-4">QBS Автонайм проводит интервью двумя способами:</p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Веб-интервью</strong> — кандидат получает уникальную ссылку
            и проходит интервью в браузере
          </li>
          <li>
            <strong className="font-semibold text-foreground">Telegram-интервью</strong> — бот проводит интервью прямо в
            мессенджере
          </li>
        </ul>

        <DocsCallout type="info" title="Поддержка голоса">
          Кандидаты могут отвечать текстом или голосовыми сообщениями. Голос
          автоматически транскрибируется с помощью AI.
        </DocsCallout>

        <h2 id="channels" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Каналы коммуникации</h2>

        <p>
          QBS Автонайм поддерживает следующие каналы для общения с кандидатами:
        </p>

        <div className="my-6 grid gap-3">
          {[
            {
              name: "Email",
              description:
                "Классическая email-переписка с отслеживанием открытий",
            },
            {
              name: "Telegram",
              description: "Быстрый мессенджер для оперативной коммуникации",
            },
            {
              name: "WhatsApp",
              description: "Популярный мессенджер для бизнеса",
            },
            {
              name: "SMS",
              description: "SMS-уведомления для срочных сообщений",
            },
            {
              name: "Веб-чат",
              description: "Виджет чата на вашем карьерном сайте",
            },
          ].map((channel) => (
            <div
              key={channel.name}
              className="flex items-center gap-3 rounded-lg border border-border p-4"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {channel.name[0]}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground">
                  {channel.name}
                </span>
                <p className="text-sm text-muted-foreground">
                  {channel.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h2 id="ai-mode" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Режим AI</h2>

        <p>
          По умолчанию AI-ассистент автоматически отвечает на сообщения
          кандидатов. В этом режиме:
        </p>

        <ul>
          <li className="text-foreground/80">AI анализирует входящее сообщение и определяет намерение</li>
          <li>
            Генерирует персонализированный ответ на основе шаблонов и контекста
          </li>
          <li>
            Может назначать собеседования, если кандидат выразил готовность
          </li>
          <li className="text-foreground/80">Передаёт диалог рекрутеру при сложных вопросах</li>
        </ul>

        <DocsCallout type="info">
          AI помечает сообщения, на которые не смог ответить уверенно. Такие
          диалоги отображаются в разделе «Требует внимания».
        </DocsCallout>

        <h2 id="manual-mode" className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20">Ручной режим</h2>

        <p>
          Вы можете отключить AI для конкретного кандидата и вести переписку
          самостоятельно:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">Откройте диалог с кандидатом</li>
          <li className="text-foreground/80">{"Нажмите переключатель «AI» в верхней части чата"}</li>
          <li className="text-foreground/80">AI приостановит автоответы для этого кандидата</li>
          <li>
            Для возврата в автоматический режим нажмите переключатель снова
          </li>
        </ol>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/ai-assistant"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Обзор
          </Link>
          <Link
            href="/ai-assistant/auto-replies"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Автоответы
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
