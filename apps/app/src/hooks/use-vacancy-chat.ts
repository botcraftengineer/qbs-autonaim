"use client";

import { useCallback, useRef, useState } from "react";

// Types based on the API route and design document
export interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatStatus = "idle" | "loading" | "streaming" | "error";

export type ErrorType =
  | "network"
  | "parse"
  | "validation"
  | "timeout"
  | "unknown";

export interface ChatError {
  type: ErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds for rate limit errors
  details?: unknown;
}

export interface UseVacancyChatOptions {
  workspaceId: string;
  initialDocument?: VacancyDocument;
  apiEndpoint?: string;
  timeout?: number; // milliseconds, default 60000 (60 seconds)
}

export interface UseVacancyChatReturn {
  document: VacancyDocument;
  messages: ConversationMessage[];
  status: ChatStatus;
  error: ChatError | null;
  sendMessage: (content: string) => Promise<void>;
  clearDocument: () => void;
  retry: () => Promise<void>;
}

/**
 * Custom hook for managing vacancy chat state and interactions
 * Handles document state, conversation history, and streaming responses
 *
 * Requirements: 1.4, 9.1, 9.2, 9.3, 9.5
 *
 * @example
 * ```tsx
 * function VacancyChatComponent() {
 *   const { document, messages, status, error, sendMessage, clearDocument } = useVacancyChat({
 *     workspaceId: "ws_123",
 *     initialDocument: { title: "Senior Developer" }
 *   });
 *
 *   const handleSend = async () => {
 *     await sendMessage("Add requirements for TypeScript experience");
 *   };
 *
 *   return (
 *     <div>
 *       <h1>{document.title}</h1>
 *       <p>{document.description}</p>
 *       {status === "streaming" && <Spinner />}
 *       {error && <ErrorMessage error={error} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useVacancyChat({
  workspaceId,
  initialDocument = {},
  apiEndpoint = "/api/vacancy/chat-generate",
  timeout = 60000, // 60 seconds default
}: UseVacancyChatOptions): UseVacancyChatReturn {
  // State for current document (VacancyDocument)
  const [document, setDocument] = useState<VacancyDocument>(initialDocument);

  // State for conversation history (max 10 messages)
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  // State for status (idle, loading, streaming, error)
  const [status, setStatus] = useState<ChatStatus>("idle");

  // State for error
  const [error, setError] = useState<ChatError | null>(null);

  // Ref to track abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to track last message for retry functionality
  const lastMessageRef = useRef<string | null>(null);

  /**
   * Creates a structured error object based on error type
   * Requirements: 8.1, 8.2, 8.3
   */
  const createError = useCallback(
    (
      type: ErrorType,
      message: string,
      retryable: boolean,
      details?: unknown,
      retryAfter?: number,
    ): ChatError => {
      return {
        type,
        message,
        retryable,
        details,
        retryAfter,
      };
    },
    [],
  );

  /**
   * Handles different types of errors and creates appropriate error objects
   * Requirements: 8.1, 8.2, 8.3
   */
  const handleError = useCallback(
    (err: unknown): ChatError => {
      // Handle abort (user cancelled)
      if (err instanceof Error && err.name === "AbortError") {
        return createError("unknown", "Запрос был отменён", false);
      }

      // Handle timeout errors
      if (err instanceof Error && err.message.includes("timeout")) {
        return createError(
          "timeout",
          "Генерация занимает слишком много времени. Попробуйте упростить запрос.",
          true,
        );
      }

      // Handle network errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        return createError(
          "network",
          "Не удалось подключиться к серверу. Проверьте интернет-соединение.",
          true,
        );
      }

      // Handle HTTP errors with structured response
      if (err instanceof Error) {
        // Try to parse error details from message
        try {
          const errorData = JSON.parse(err.message);

          // Rate limit error (429)
          if (errorData.retryAfter) {
            return createError(
              "network",
              `Превышен лимит запросов. Попробуйте через ${errorData.retryAfter} секунд.`,
              true,
              errorData,
              errorData.retryAfter,
            );
          }

          // Validation error (400)
          if (errorData.details) {
            return createError(
              "validation",
              "Ошибка валидации данных. Проверьте введённую информацию.",
              false,
              errorData.details,
            );
          }

          // Authentication error (401)
          if (
            err.message.includes("401") ||
            errorData.error?.includes("авторизован")
          ) {
            return createError(
              "network",
              "Сессия истекла. Пожалуйста, войдите снова.",
              false,
            );
          }

          // Authorization error (403)
          if (
            err.message.includes("403") ||
            errorData.error?.includes("доступа")
          ) {
            return createError(
              "network",
              "Нет доступа к workspace. Обратитесь к администратору.",
              false,
            );
          }

          // Generic error with message
          if (errorData.error) {
            return createError("unknown", errorData.error, true);
          }
        } catch {
          // Not JSON, continue with regular error handling
        }

        // HTTP status errors
        if (err.message.includes("HTTP error")) {
          return createError(
            "network",
            "Ошибка сервера. Попробуйте позже.",
            true,
          );
        }

        // Parse errors
        if (err.message.includes("parse") || err.message.includes("JSON")) {
          return createError(
            "parse",
            "Не удалось обработать ответ. Попробуйте переформулировать запрос.",
            true,
          );
        }

        // Generic error
        return createError(
          "unknown",
          err.message || "Произошла неизвестная ошибка",
          true,
        );
      }

      // Fallback for unknown errors
      return createError("unknown", "Произошла неизвестная ошибка", true);
    },
    [createError],
  );

  /**
   * Sends a message to the AI and handles streaming response
   * Requirements: 1.1, 1.2, 9.4, 8.1, 8.2, 8.3
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Store message for retry functionality
      lastMessageRef.current = content;

      // Clear previous error
      setError(null);
      setStatus("loading");

      // Add user message to conversation history
      const userMessage: ConversationMessage = {
        role: "user",
        content,
      };

      setMessages((prev) => {
        // Maintain max 10 messages
        const updated = [...prev, userMessage];
        return updated.slice(-10);
      });

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Create timeout controller
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, timeout);

      try {
        // Prepare conversation history (max 10 messages)
        const conversationHistory = messages.slice(-10);

        // Send POST request to /api/vacancy/chat-generate
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId,
            message: content,
            currentDocument: document,
            conversationHistory,
          }),
          signal: abortControllerRef.current.signal,
        });

        // Clear timeout on successful response
        clearTimeout(timeoutId);

        if (!response.ok) {
          // Try to parse error response
          let errorData: unknown;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP error! status: ${response.status}` };
          }

          // Throw error with structured data
          throw new Error(JSON.stringify(errorData));
        }

        // Handle streaming response (SSE)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        setStatus("streaming");

        const decoder = new TextDecoder();
        let accumulatedText = "";
        let assistantResponse = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Parse SSE events (data: {...})
          const lines = accumulatedText.split("\n");
          accumulatedText = lines.pop() || ""; // Keep incomplete line

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                // Handle partial updates (partial: true)
                if (parsed.partial) {
                  setDocument((prev) => ({
                    ...prev,
                    ...parsed.document,
                  }));
                }

                // Handle final update (done: true)
                if (parsed.done) {
                  setDocument((prev) => ({
                    ...prev,
                    ...parsed.document,
                  }));

                  // Store assistant response for conversation history
                  assistantResponse = JSON.stringify(parsed.document);

                  // Handle errors from server
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", parseError);
                // Create parse error
                const error = handleError(parseError);
                setError(error);
                setStatus("error");
                return;
              }
            }
          }
        }

        // Add assistant message to conversation history
        if (assistantResponse) {
          const assistantMessage: ConversationMessage = {
            role: "assistant",
            content: assistantResponse,
          };

          setMessages((prev) => {
            const updated = [...prev, assistantMessage];
            return updated.slice(-10);
          });
        }

        setStatus("idle");
      } catch (err) {
        // Clear timeout on error
        clearTimeout(timeoutId);

        // Handle abort (don't show error for user cancellation)
        if (err instanceof Error && err.name === "AbortError") {
          // Check if it was a timeout
          if (abortControllerRef.current?.signal.aborted) {
            const timeoutError = handleError(new Error("Request timeout"));
            setError(timeoutError);
            setStatus("error");
          } else {
            // User cancelled, just reset to idle
            setStatus("idle");
          }
          return;
        }

        // Handle other errors
        const chatError = handleError(err);
        setError(chatError);
        setStatus("error");
      } finally {
        clearTimeout(timeoutId);
        abortControllerRef.current = null;
      }
    },
    [workspaceId, document, messages, apiEndpoint, timeout, handleError],
  );

  /**
   * Retries the last message
   * Requirements: 8.2
   */
  const retry = useCallback(async () => {
    if (lastMessageRef.current) {
      // Remove the last user message from history before retrying
      setMessages((prev) => {
        const filtered = prev.filter((msg, idx) => {
          // Remove last user message
          if (idx === prev.length - 1 && msg.role === "user") {
            return false;
          }
          return true;
        });
        return filtered;
      });

      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  /**
   * Clears the current document
   */
  const clearDocument = useCallback(() => {
    setDocument({});
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    document,
    messages,
    status,
    error,
    sendMessage,
    clearDocument,
    retry,
  };
}
