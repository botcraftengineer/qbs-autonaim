"use client";

import { cn } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAIChatStream } from "~/hooks/use-ai-chat-stream";
import { useTRPC } from "~/trpc/react";
import { convertLegacyMessage } from "~/types/ai-chat";
import { AIChatInput } from "./ai-chat-input";
import { AIMessages } from "./ai-messages";

// Статичный компонент на уровне модуля для стабильной ссылки
const INTERVIEW_EMPTY_STATE = (
  <div className="flex min-h-[300px] items-center justify-center">
    <div className="text-center text-muted-foreground">
      <p className="text-sm">Начните диалог</p>
      <p className="mt-1 text-xs">Напишите сообщение, чтобы начать интервью</p>
    </div>
  </div>
);

interface InterviewChatProps {
  /** ID разговора/response */
  conversationId: string;
  /** API endpoint для streaming */
  apiEndpoint?: string;
  /** Показывать статус подключения */
  showConnectionStatus?: boolean;
  /** CSS класс */
  className?: string;
}

/**
 * Компонент чата для интервью с загрузкой истории через tRPC
 */
export function InterviewChat({
  conversationId,
  apiEndpoint = "/api/chat/stream",
  showConnectionStatus = true,
  className,
}: InterviewChatProps) {
  const trpc = useTRPC();
  const [isOnline, setIsOnline] = useState(true);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Загружаем историю сообщений
  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery(
    trpc.freelancePlatforms.getChatHistory.queryOptions({
      conversationId,
    }),
  );

  // Конвертируем legacy сообщения в новый формат
  const initialMessages = useMemo(() => {
    if (!chatHistory?.messages) return [];
    return chatHistory.messages.map(convertLegacyMessage);
  }, [chatHistory?.messages]);

  const {
    messages,
    status: chatStatus,
    error,
    sendMessage,
    stop,
    setMessages,
  } = useAIChatStream({
    apiEndpoint,
    initialMessages: [],
    chatId: conversationId,
    onError: (err) => {
      console.error("Chat error:", err);
      setIsOnline(false);

      // Очищаем предыдущий таймер, если есть
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }

      // Устанавливаем новый таймер восстановления
      recoveryTimeoutRef.current = setTimeout(() => {
        setIsOnline(true);
        recoveryTimeoutRef.current = null;
      }, 5000);
    },
  });

  // Отслеживаем текущий conversationId для сброса при смене
  const currentConversationIdRef = useRef(conversationId);

  // Устанавливаем начальные сообщения после загрузки истории
  useEffect(() => {
    // Сбрасываем флаг при смене conversationId
    if (currentConversationIdRef.current !== conversationId) {
      isInitializedRef.current = false;
      currentConversationIdRef.current = conversationId;
    }

    if (!isInitializedRef.current && initialMessages.length > 0) {
      setMessages(initialMessages);
      isInitializedRef.current = true;
    }
  }, [conversationId, initialMessages, setMessages]);

  // Отслеживаем онлайн статус
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Очищаем таймер восстановления при размонтировании
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const status = chatHistory?.status || "ACTIVE";
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const isDisabled = isCompleted || isCancelled || !isOnline;

  // Показываем загрузку
  if (isLoadingHistory) {
    return (
      <div className={cn("flex h-full flex-col", className)}>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Загрузка истории…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Заголовок */}
      <header className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground">AI Интервью</h1>
            <p className="text-sm text-muted-foreground">
              {isCompleted && "Интервью завершено"}
              {isCancelled && "Интервью отменено"}
              {!isCompleted && !isCancelled && "Активный диалог"}
            </p>
          </div>

          {/* Статус подключения */}
          {showConnectionStatus && (
            <output
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                isOnline
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
              )}
              aria-live="polite"
            >
              {isOnline ? (
                <>
                  <Wifi className="size-3" aria-hidden="true" />
                  <span>Онлайн</span>
                </>
              ) : (
                <>
                  <WifiOff className="size-3" aria-hidden="true" />
                  <span>Переподключение…</span>
                </>
              )}
            </output>
          )}
        </div>
      </header>

      {/* Ошибка */}
      {error && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <p>{error.message}</p>
        </div>
      )}

      {/* Сообщения */}
      <AIMessages
        messages={messages}
        status={chatStatus}
        isReadonly={isDisabled}
        emptyStateComponent={INTERVIEW_EMPTY_STATE}
      />

      {/* Ввод */}
      {!isCompleted && !isCancelled && (
        <AIChatInput
          onSendMessage={handleSendMessage}
          onStop={stop}
          status={chatStatus}
          disabled={!isOnline}
          placeholder={
            !isOnline
              ? "Переподключение…"
              : chatStatus === "streaming"
                ? "Ожидайте ответа…"
                : "Напишите сообщение…"
          }
        />
      )}

      {/* Сообщение о завершении */}
      {(isCompleted || isCancelled) && (
        <div className="border-t bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          {isCompleted && "Интервью завершено. Спасибо за участие!"}
          {isCancelled && "Интервью было отменено."}
        </div>
      )}
    </div>
  );
}
