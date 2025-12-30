"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AIChatMessage,
  ChatStatus,
  MessagePart,
  TextPart,
} from "~/types/ai-chat";

interface UseAIChatStreamOptions {
  apiEndpoint: string;
  initialMessages?: AIChatMessage[];
  chatId?: string;
  onMessage?: (message: AIChatMessage) => void;
  onError?: (error: Error) => void;
  onFinish?: (messages: AIChatMessage[]) => void;
}

type StreamPartType =
  | "0" // text-delta
  | "2" // data
  | "8" // message-start
  | "d" // finish-message
  | "e" // error
  | "f" // finish-step
  | "g" // reasoning
  | "a" // tool-call
  | "b"; // tool-result

interface StreamPart {
  type: StreamPartType;
  value: unknown;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseStreamLine(line: string): StreamPart | null {
  if (!line.startsWith("data: ")) return null;

  try {
    const jsonStr = line.slice(6);
    if (jsonStr === "[DONE]") return { type: "d", value: null };

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return { type: parsed[0] as StreamPartType, value: parsed[1] };
    }
    return null;
  } catch {
    return null;
  }
}

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
  const messagesRef = useRef<AIChatMessage[]>(messages);

  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      lastUserMessageRef.current = content;
      setError(null);
      setStatus("submitted");

      const userMessageId = generateId();
      const userMessage: AIChatMessage = {
        id: userMessageId,
        role: "user",
        parts: [{ type: "text", text: content }],
        createdAt: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        messagesRef.current = updated;
        return updated;
      });

      const assistantMessageId = generateId();
      const assistantMessage: AIChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        parts: [],
        createdAt: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        messagesRef.current = updated;
        return updated;
      });

      abortControllerRef.current = new AbortController();

      try {
        const currentMessages = messagesRef.current;
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            id: chatId,
            message: {
              id: userMessageId,
              role: "user",
              parts: [{ type: "text", text: content }],
            },
            messages: currentMessages
              .filter((m) => m.role !== "assistant" || m.parts.length > 0)
              .map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts
                  .filter((p): p is TextPart => p.type === "text")
                  .map((p) => ({ type: "text" as const, text: p.text })),
              })),
            conversationId: chatId,
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

            const parsed = parseStreamLine(trimmedLine);
            if (!parsed) continue;

            const { type, value: data } = parsed;

            switch (type) {
              case "0": {
                // text-delta
                if (!currentTextPart) {
                  currentTextPart = { type: "text", text: "" };
                  currentParts.push(currentTextPart);
                }
                currentTextPart.text += data as string;
                break;
              }

              case "g": {
                // reasoning
                currentParts.push({
                  type: "reasoning",
                  text: data as string,
                });
                break;
              }

              case "a": {
                // tool-call
                const toolData = data as {
                  toolCallId: string;
                  toolName: string;
                  args: unknown;
                };
                currentParts.push({
                  type: "tool-call",
                  toolCallId: toolData.toolCallId,
                  toolName: toolData.toolName,
                  args: toolData.args,
                });
                break;
              }

              case "b": {
                // tool-result
                const resultData = data as {
                  toolCallId: string;
                  result: unknown;
                };
                currentParts.push({
                  type: "tool-result",
                  toolCallId: resultData.toolCallId,
                  result: resultData.result,
                });
                break;
              }

              case "e": {
                // error
                throw new Error(data as string);
              }

              case "d":
              case "f": {
                // finish
                break;
              }
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, parts: [...currentParts] }
                  : msg,
              ),
            );
          }
        }

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
        setMessages((prev) => {
          onFinish?.(prev);
          return prev;
        });
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
    [apiEndpoint, chatId, onMessage, onError, onFinish],
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
      let lastUserIndex = -1;

      for (let i = prev.length - 1; i >= 0; i--) {
        const msg = prev[i];
        if (msg) {
          if (lastAssistantIndex === -1 && msg.role === "assistant") {
            lastAssistantIndex = i;
          }
          if (lastUserIndex === -1 && msg.role === "user") {
            lastUserIndex = i;
          }
        }
        if (lastAssistantIndex !== -1 && lastUserIndex !== -1) break;
      }

      if (lastAssistantIndex === -1 || lastUserIndex === -1) return prev;

      const cutIndex = Math.min(lastAssistantIndex, lastUserIndex);
      return prev.slice(0, cutIndex);
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
