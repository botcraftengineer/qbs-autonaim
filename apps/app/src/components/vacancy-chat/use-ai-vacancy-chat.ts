"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ChatError,
  ChatStatus,
  ConversationMessage,
  QuickReply,
  VacancyDocument,
} from "./types";

interface UseAIVacancyChatOptions {
  workspaceId: string;
  initialDocument?: VacancyDocument;
  apiEndpoint?: string;
  timeout?: number;
}

interface UseAIVacancyChatReturn {
  document: VacancyDocument;
  messages: ConversationMessage[];
  status: ChatStatus;
  error: ChatError | null;
  sendMessage: (content: string) => Promise<void>;
  selectQuickReply: (value: string) => Promise<void>;
  clearChat: () => void;
  retry: () => Promise<void>;
}

const WELCOME_MESSAGE: ConversationMessage = {
  id: "welcome",
  role: "assistant",
  content: `Привет! 👋 Я помогу создать вакансию.

Расскажите, кого ищете? Можете описать своими словами или выбрать один из вариантов ниже.`,
  quickReplies: [
    { id: "dev", label: "💻 Разработчик", value: "Ищу разработчика" },
    { id: "design", label: "🎨 Дизайнер", value: "Ищу дизайнера" },
    { id: "pm", label: "📋 Менеджер проекта", value: "Ищу менеджера проекта" },
    { id: "marketing", label: "📈 Маркетолог", value: "Ищу маркетолога" },
    {
      id: "sales",
      label: "💼 Менеджер по продажам",
      value: "Ищу менеджера по продажам",
    },
  ],
  timestamp: new Date(),
};

export function useAIVacancyChat({
  workspaceId,
  initialDocument = {},
  apiEndpoint = "/api/vacancy/chat-generate",
  timeout = 60000,
}: UseAIVacancyChatOptions): UseAIVacancyChatReturn {
  const [document, setDocument] = useState<VacancyDocument>(initialDocument);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<ChatError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string | null>(null);

  const createError = useCallback(
    (
      type: ChatError["type"],
      message: string,
      retryable: boolean,
    ): ChatError => ({
      type,
      message,
      retryable,
    }),
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "streaming" || status === "loading")
        return;

      lastMessageRef.current = content;
      setError(null);
      setStatus("loading");

      // Добавляем сообщение пользователя
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Добавляем placeholder для ответа ассистента
      const assistantPlaceholder: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [
        ...prev.slice(-18),
        userMessage,
        assistantPlaceholder,
      ]);

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        timeout,
      );

      try {
        const conversationHistory = messages
          .filter((m) => m.id !== "welcome")
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            message: content.trim(),
            currentDocument: document,
            conversationHistory,
          }),
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        setStatus("streaming");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let latestMessage = "";
        let latestQuickReplies: QuickReply[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              // Обновляем документ
              if (data.document) {
                setDocument(data.document);
              }

              // Обновляем сообщение в реальном времени
              if (data.message) {
                latestMessage = data.message;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.isStreaming ? { ...m, content: latestMessage } : m,
                  ),
                );
              }

              // Финальный ответ с quickReplies
              if (data.done) {
                latestQuickReplies = data.quickReplies;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.isStreaming
                      ? {
                          ...m,
                          content: latestMessage || "Готово!",
                          quickReplies: latestQuickReplies,
                          isStreaming: false,
                        }
                      : m,
                  ),
                );
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }

        setStatus("idle");
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        const chatError = createError(
          "network",
          err instanceof Error ? err.message : "Произошла ошибка",
          true,
        );
        setError(chatError);
        setStatus("error");

        // Убираем placeholder при ошибке
        setMessages((prev) => prev.filter((m) => !m.isStreaming));
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      workspaceId,
      document,
      messages,
      apiEndpoint,
      timeout,
      status,
      createError,
    ],
  );

  const selectQuickReply = useCallback(
    async (value: string) => {
      await sendMessage(value);
    },
    [sendMessage],
  );

  const retry = useCallback(async () => {
    if (lastMessageRef.current) {
      setMessages((prev) => prev.filter((m) => !m.isStreaming));
      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setDocument({});
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    document,
    messages,
    status,
    error,
    sendMessage,
    selectQuickReply,
    clearChat,
    retry,
  };
}
