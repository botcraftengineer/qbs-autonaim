"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AIChatMessage,
  ChatStatus,
  MessagePart,
  TextPart,
} from "~/types/ai-chat";

interface UseAIChatStreamOptions {
  /** API endpoint для SSE streaming */
  apiEndpoint: string;
  /** Начальные сообщения */
  initialMessages?: AIChatMessage[];
  /** ID чата/разговора */
  chatId?: string;
  /** Callback при получении нового сообщения */
  onMessage?: (message: AIChatMessage) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
  /** Callback при завершении */
  onFinish?: (messages: AIChatMessage[]) => void;
}

/**
 * Хук для работы с AI чатом через SSE (Server-Sent Events)
 * Поддерживает формат ai-sdk createUIMessageStream
 */
export function useAIChatStream({
  apiEndpoint,
  initialMessages = [],
  chatId,
  onMessage,
  onError,
  onFinish,
}: UseAIChatStreamOptions) {
  const [messages, setMessages] = useState<AIChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");

  const generateId = useCallback(
    () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const parseSSELine = useCallback(
    (line: string): { type: string; data: unknown } | null => {
      if (!line.startsWith("data: ")) return null;

      try {
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") return { type: "done", data: null };
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      lastUserMessageRef.current = content;
      setError(null);
      setStatus("submitted");

      const userMessage: AIChatMessage = {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: content }],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const assistantMessageId = generateId();
      const assistantMessage: AIChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        parts: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            message: content,
            chatId,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.parts
                .filter((p): p is TextPart => p.type === "text")
                .map((p) => p.text)
                .join("\n"),
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        setStatus("streaming");

        const decoder = new TextDecoder();
        let buffer = "";
        const currentParts: MessagePart[] = [];
        let currentTextPart: TextPart | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const parsed = parseSSELine(trimmedLine);
            if (!parsed) continue;

            const { type, data } = parsed;

            switch (type) {
              case "text-delta": {
                if (!currentTextPart) {
                  currentTextPart = { type: "text", text: "" };
                  currentParts.push(currentTextPart);
                }
                currentTextPart.text += data as string;
                break;
              }

              case "reasoning": {
                currentParts.push({
                  type: "reasoning",
                  text: data as string,
                });
                break;
              }

              case "tool-call": {
                const toolData = data as {
                  id: string;
                  name: string;
                  args: unknown;
                };
                currentParts.push({
                  type: "tool-call",
                  toolCallId: toolData.id,
                  toolName: toolData.name,
                  args: toolData.args,
                });
                break;
              }

              case "tool-result": {
                const resultData = data as { id: string; result: unknown };
                currentParts.push({
                  type: "tool-result",
                  toolCallId: resultData.id,
                  result: resultData.result,
                });
                break;
              }

              case "error": {
                throw new Error(data as string);
              }

              case "done": {
                // Stream завершён
                break;
              }
            }

            // Обновляем сообщение
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, parts: [...currentParts] }
                  : msg,
              ),
            );
          }
        }

        // Финальное обновление
        const finalMessage: AIChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          parts: currentParts,
          createdAt: new Date(),
        };

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? finalMessage : msg,
          ),
        );

        onMessage?.(finalMessage);
        onFinish?.([...messages, userMessage, finalMessage]);
        setStatus("idle");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        onError?.(error);

        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      apiEndpoint,
      chatId,
      generateId,
      messages,
      onMessage,
      onError,
      onFinish,
      parseSSELine,
    ],
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("idle");
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  const regenerate = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    setMessages((prev) => {
      let lastAssistantIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        const msg = prev[i];
        if (msg && msg.role === "assistant") {
          lastAssistantIndex = i;
          break;
        }
      }
      if (lastAssistantIndex === -1) return prev;
      return prev.slice(0, lastAssistantIndex);
    });

    setMessages((prev) => {
      let lastUserIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        const msg = prev[i];
        if (msg && msg.role === "user") {
          lastUserIndex = i;
          break;
        }
      }
      if (lastUserIndex === -1) return prev;
      return prev.slice(0, lastUserIndex);
    });

    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  return {
    messages,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
    clearMessages,
    regenerate,
  };
}
