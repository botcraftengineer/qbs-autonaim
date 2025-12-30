"use client";

import { cn } from "@qbs-autonaim/ui";
import { ChevronDown, Sparkles, User } from "lucide-react";
import { memo, useState } from "react";
import type { AIChatMessage, MessagePart, TextPart } from "~/types/ai-chat";

interface AIMessageProps {
  message: AIChatMessage;
  isLoading?: boolean;
  isReadonly?: boolean;
}

/**
 * Компонент отображения сообщения AI чата
 * Адаптирован из ai-chatbot message.tsx
 */
function PureAIMessage({ message, isLoading = false }: AIMessageProps) {
  const isUser = message.role === "user";
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  const textParts = message.parts.filter(
    (part): part is TextPart => part.type === "text" && !!part.text?.trim(),
  );

  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning" && part.text?.trim(),
  );

  const fileParts = message.parts.filter((part) => part.type === "file");

  return (
    <article
      className="group/message w-full animate-in fade-in duration-200"
      data-role={message.role}
      aria-label={`Сообщение от ${isUser ? "вас" : "ассистента"}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": isUser,
          "justify-start": !isUser,
        })}
      >
        {/* Аватар ассистента */}
        {!isUser && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
        )}

        <div
          className={cn("flex flex-col gap-2", {
            "w-full": !isUser,
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]": isUser,
          })}
        >
          {/* Файлы/вложения */}
          {fileParts.length > 0 && (
            <div className="flex flex-row justify-end gap-2">
              {fileParts.map((part) => (
                <FileAttachment
                  key={part.type === "file" ? part.url : `file-${message.id}`}
                  part={part}
                />
              ))}
            </div>
          )}

          {/* Reasoning (мышление модели) */}
          {reasoningParts.length > 0 && (
            <ReasoningBlock
              parts={reasoningParts}
              isExpanded={isReasoningExpanded}
              onToggle={() => setIsReasoningExpanded(!isReasoningExpanded)}
              isLoading={isLoading}
            />
          )}

          {/* Текстовые части */}
          {textParts.map((part) => (
            <div
              key={`${message.id}-${part.text.slice(0, 20)}`}
              className={cn(
                "wrap-break-word rounded-2xl px-3 py-2",
                isUser
                  ? "bg-primary text-primary-foreground text-right"
                  : "bg-muted text-foreground text-left",
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {part.text}
              </p>
            </div>
          ))}

          {/* Индикатор загрузки */}
          {isLoading && !isUser && textParts.length === 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <span className="animate-pulse">Думаю</span>
              <span className="inline-flex">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">
                  .
                </span>
                <span className="animate-bounce [animation-delay:300ms]">
                  .
                </span>
              </span>
            </div>
          )}

          {/* Время сообщения */}
          <time
            className={cn(
              "text-xs",
              isUser
                ? "text-right text-muted-foreground"
                : "text-muted-foreground",
            )}
            dateTime={message.createdAt.toISOString()}
          >
            {message.createdAt.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        {/* Аватар пользователя */}
        {isUser && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Компонент для отображения файлов
 */
function FileAttachment({ part }: { part: MessagePart }) {
  if (part.type !== "file") return null;

  const isAudio = part.mediaType.startsWith("audio/");
  const isImage = part.mediaType.startsWith("image/");

  if (isAudio) {
    return (
      <div className="rounded-lg bg-muted p-2">
        <audio
          controls
          src={part.url}
          className="max-w-[200px]"
          aria-label={part.filename || "Голосовое сообщение"}
        >
          <track kind="captions" />
        </audio>
      </div>
    );
  }

  if (isImage) {
    return (
      // biome-ignore lint: динамический URL из внешнего источника требует img
      <img
        src={part.url}
        alt={part.filename || "Изображение"}
        className="max-h-[200px] max-w-[200px] rounded-lg object-cover"
        loading="lazy"
        width={200}
        height={200}
      />
    );
  }

  return (
    <a
      href={part.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80"
    >
      📎 {part.filename || "Файл"}
    </a>
  );
}

/**
 * Компонент для отображения reasoning (мышления модели)
 */
function ReasoningBlock({
  parts,
  isExpanded,
  onToggle,
  isLoading,
}: {
  parts: MessagePart[];
  isExpanded: boolean;
  onToggle: () => void;
  isLoading: boolean;
}) {
  const reasoningText = parts
    .filter((p) => p.type === "reasoning")
    .map((p) => (p as { text: string }).text)
    .join("\n");

  return (
    <div className="rounded-lg border bg-muted/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/80"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          {isLoading && <span className="animate-pulse">💭</span>}
          {!isLoading && "💭"}
          Размышления
        </span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      {isExpanded && (
        <div className="border-t px-3 py-2">
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">
            {reasoningText}
          </p>
        </div>
      )}
    </div>
  );
}

export const AIMessage = memo(PureAIMessage, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.parts.length !== nextProps.message.parts.length)
    return false;
  return true;
});
