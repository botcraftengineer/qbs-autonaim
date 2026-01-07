"use client";

import { useChat } from "@ai-sdk/react";
import { cn } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { AlertCircle, ArrowDown, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import Markdown from "react-markdown";
import { useScrollToBottom } from "~/hooks/use-scroll-to-bottom";
import { useTRPC } from "~/trpc/react";
import type { ChatStatus } from "~/types/ai-chat";
import { AIChatInput } from "./ai-chat-input";

// Типы для сообщений
interface MessagePart {
  type: "text" | "file";
  text?: string;
  url?: string;
  mediaType?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
  createdAt?: Date;
}

function InterviewGreeting() {
  return (
    <div className="mx-auto mt-8 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20"
      >
        <Sparkles className="size-6 text-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-semibold text-xl md:text-2xl"
      >
        Добро пожаловать!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-1 text-muted-foreground text-xl md:text-2xl"
      >
        Готовы начать интервью?
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-muted-foreground text-sm"
      >
        Напишите сообщение, чтобы начать диалог с AI-ассистентом
      </motion.p>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <output
      className="group/message fade-in block w-full animate-in duration-300"
      data-role="assistant"
      aria-label="AI думает"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <div className="animate-pulse">
            <Sparkles className="size-4 text-primary" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Думаю</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </output>
  );
}

// Компонент сообщения
interface MessageProps {
  message: ChatMessage;
  isLoading?: boolean;
}

const Message = memo(function Message({ message, isLoading }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": isUser,
          "justify-start": !isUser,
        })}
      >
        {!isUser && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="size-4 text-primary" />
          </div>
        )}

        <div
          className={cn("flex flex-col gap-2", {
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]": isUser,
            "w-full": !isUser,
          })}
        >
          {message.parts.map((part, index) => {
            if (part.type === "file" && part.url) {
              return (
                <div key={`${message.id}-file-${index}`} className="mb-2">
                  {/* biome-ignore lint/a11y/useMediaCaption: голосовое сообщение */}
                  <audio
                    controls
                    src={part.url}
                    className="h-10 max-w-[250px]"
                    aria-label="Голосовое сообщение"
                  />
                </div>
              );
            }

            if (part.type === "text" && part.text) {
              if (isUser) {
                return (
                  <div
                    key={`${message.id}-text-${index}`}
                    className="wrap-break-word rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
                  >
                    <p className="whitespace-pre-wrap">{part.text}</p>
                  </div>
                );
              }

              // Ответ AI — рендерим markdown
              return (
                <div
                  key={`${message.id}-text-${index}`}
                  className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                >
                  <Markdown>{part.text}</Markdown>
                </div>
              );
            }

            return null;
          })}

          {isLoading && !isUser && message.parts.length === 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <span className="animate-pulse">Генерирую</span>
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
        </div>
      </div>
    </div>
  );
});

// Компонент списка сообщений
interface MessagesListProps {
  messages: ChatMessage[];
  status: ChatStatus;
  emptyStateComponent?: React.ReactNode;
}

function MessagesList({
  messages,
  status,
  emptyStateComponent,
}: MessagesListProps) {
  const { containerRef, endRef, isAtBottom, scrollToBottom } =
    useScrollToBottom();

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="История чата"
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {messages.length === 0 && emptyStateComponent}

          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isLoading={isStreaming && index === messages.length - 1}
            />
          ))}

          {isSubmitted && <ThinkingIndicator />}

          <div
            ref={endRef}
            className="min-h-[24px] min-w-[24px] shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Прокрутить вниз"
        className={cn(
          "-translate-x-1/2 absolute bottom-4 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted",
          isAtBottom
            ? "pointer-events-none scale-0 opacity-0"
            : "pointer-events-auto scale-100 opacity-100",
        )}
        onClick={() => scrollToBottom("smooth")}
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  );
}

// Конвертация legacy сообщений в новый формат
function convertLegacyMessage(message: {
  id: string;
  sender: "BOT" | "CANDIDATE" | "ADMIN";
  content: string;
  contentType: "TEXT" | "VOICE";
  createdAt: Date;
  voiceTranscription?: string | null;
  fileUrl?: string | null;
}): ChatMessage {
  const role = message.sender === "CANDIDATE" ? "user" : "assistant";
  const parts: MessagePart[] = [];

  if (message.contentType === "VOICE" && message.fileUrl) {
    parts.push({
      type: "file",
      url: message.fileUrl,
      mediaType: "audio/ogg",
    });
    if (message.voiceTranscription) {
      parts.push({ type: "text", text: message.voiceTranscription });
    }
  } else {
    parts.push({ type: "text", text: message.content });
  }

  return { id: message.id, role, parts, createdAt: message.createdAt };
}

// Конвертация UIMessage из AI SDK в наш формат
function convertUIMessage(msg: {
  id: string;
  role: string;
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): ChatMessage {
  const parts: MessagePart[] = [];

  if (msg.parts) {
    for (const part of msg.parts) {
      if (part.type === "text" && part.text) {
        parts.push({ type: "text", text: part.text });
      }
    }
  } else if (msg.content) {
    parts.push({ type: "text", text: msg.content });
  }

  return {
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    parts,
  };
}

function generateUUID(): string {
  return crypto.randomUUID();
}

interface InterviewChatProps {
  conversationId: string;
  apiEndpoint?: string;
  className?: string;
}

export function InterviewChat({
  conversationId,
  apiEndpoint = "/api/interview/chat/stream",
  className,
}: InterviewChatProps) {
  const trpc = useTRPC();
  const isInitializedRef = useRef(false);
  const currentConversationIdRef = useRef(conversationId);

  // Загрузка истории чата
  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery(
    trpc.freelancePlatforms.getChatHistory.queryOptions({ conversationId }),
  );

  // Конвертация истории в формат для отображения
  const historyMessages = useMemo(() => {
    if (!chatHistory?.messages) return [];
    return chatHistory.messages.map(convertLegacyMessage);
  }, [chatHistory?.messages]);

  // useChat из AI SDK с нативным стримингом
  const {
    messages: rawMessages,
    status: rawStatus,
    error,
    sendMessage,
    stop,
    setMessages,
  } = useChat({
    id: conversationId,
    experimental_throttle: 50,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      body: { conversationId },
    }),
    onError: (err) => {
      console.error("[InterviewChat] Error:", err);
    },
  });

  // Конвертация статуса
  const status: ChatStatus = useMemo(() => {
    if (rawStatus === "submitted") return "submitted";
    if (rawStatus === "streaming") return "streaming";
    if (rawStatus === "error") return "error";
    return "idle";
  }, [rawStatus]);

  // Конвертация сообщений в наш формат
  const messages: ChatMessage[] = useMemo(() => {
    return rawMessages.map(convertUIMessage);
  }, [rawMessages]);

  // Синхронизация истории при загрузке
  useEffect(() => {
    if (currentConversationIdRef.current !== conversationId) {
      isInitializedRef.current = false;
      currentConversationIdRef.current = conversationId;
    }
    if (
      !isInitializedRef.current &&
      historyMessages.length > 0 &&
      rawMessages.length === 0
    ) {
      // Конвертируем в формат AI SDK
      const sdkMessages = historyMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.parts.find((p) => p.type === "text")?.text || "",
        parts: msg.parts
          .filter((p) => p.type === "text")
          .map((p) => ({ type: "text" as const, text: p.text || "" })),
      }));
      setMessages(sdkMessages);
      isInitializedRef.current = true;
    }
  }, [conversationId, historyMessages, rawMessages.length, setMessages]);

  // Отправка сообщения
  const handleSendMessage = useCallback(
    async (content: string, _audioFile?: File) => {
      if (!content.trim()) return;

      // TODO: Добавить поддержку аудио
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: content }],
      });
    },
    [sendMessage],
  );

  const chatStatus = chatHistory?.status || "ACTIVE";
  const isCompleted = chatStatus === "COMPLETED";
  const isCancelled = chatStatus === "CANCELLED";
  const isReadonly = isCompleted || isCancelled;

  if (isLoadingHistory) {
    return (
      <div
        className={cn("flex h-dvh min-w-0 flex-col bg-background", className)}
      >
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Загрузка…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-dvh min-w-0 touch-pan-y flex-col bg-background",
        className,
      )}
    >
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background px-4 py-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-medium text-sm">AI Интервью</h1>
          <p className="text-muted-foreground text-xs">
            {isCompleted && "Завершено"}
            {isCancelled && "Отменено"}
            {!isReadonly &&
              (rawStatus === "streaming" ? "Генерирую…" : "Онлайн")}
          </p>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <p>{error.message}</p>
        </div>
      )}

      <MessagesList
        messages={messages}
        status={status}
        emptyStateComponent={<InterviewGreeting />}
      />

      <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 bg-background px-2 pb-3 md:px-4 md:pb-4">
        {!isReadonly && (
          <AIChatInput
            onSendMessage={handleSendMessage}
            onStop={stop}
            status={status}
            placeholder={
              status === "streaming"
                ? "Ожидайте ответа…"
                : "Напишите сообщение…"
            }
          />
        )}
      </div>

      {isReadonly && (
        <div className="border-t bg-muted/30 px-4 py-3 text-center text-muted-foreground text-sm">
          {isCompleted && "Интервью завершено. Спасибо за участие!"}
          {isCancelled && "Интервью было отменено."}
        </div>
      )}
    </div>
  );
}
