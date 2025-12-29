"use client";

import { ScrollArea } from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { VacancyChatInput } from "./vacancy-chat-input";
import { VacancyChatMessage } from "./vacancy-chat-message";
import { VacancyDocumentPreview } from "./vacancy-document-preview";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
}

interface VacancyCreatorContainerProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function VacancyCreatorContainer({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: VacancyCreatorContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [document, setDocument] = useState<VacancyDocument>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: createVacancy, isPending: isCreatingVacancy } = useMutation(
    trpc.vacancy.create.mutationOptions({
      onSuccess: (vacancy: { id: string }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.list.queryKey(),
        });
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancy.id}`,
        );
      },
      onError: (error: Error) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Ошибка создания вакансии: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
      },
    }),
  );

  const handleVacancyCreated = () => {
    if (!document.title) return;

    createVacancy({
      workspaceId,
      title: document.title,
      description: document.description,
      requirements: document.requirements,
      responsibilities: document.responsibilities,
      conditions: document.conditions,
    });
  };

  const generateVacancy = async (input: {
    workspaceId: string;
    message: string;
    currentDocument: VacancyDocument;
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
  }) => {
    if (!isMountedRef.current) return;

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/vacancy/chat-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка генерации");
      }

      if (!response.body) {
        throw new Error("Нет тела ответа");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.document && data.done) {
                if (!isMountedRef.current || !abortControllerRef.current) {
                  return;
                }

                setDocument(data.document);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "Документ обновлён",
                    timestamp: new Date(),
                  },
                ]);
              }
            } catch (parseError) {
              console.error("Ошибка парсинга SSE:", parseError);
              if (!isMountedRef.current || !abortControllerRef.current) {
                return;
              }
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: "Ошибка обработки данных от сервера",
                  timestamp: new Date(),
                },
              ]);
              break;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (!isMountedRef.current || !abortControllerRef.current) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
      abortControllerRef.current = null;
    }
  };

  // Cleanup при размонтировании
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Автоскролл к новым сообщениям
  useEffect(() => {
    if (messages.length > 0 || isGenerating) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isGenerating]);

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    generateVacancy({
      workspaceId,
      message,
      currentDocument: document,
      conversationHistory,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* Чат слева */}
      <section className="flex w-full flex-col border-b md:w-1/2 md:border-b-0 md:border-r">
        <header className="border-b p-4">
          <h2 className="text-lg font-semibold">Чат с&nbsp;ассистентом</h2>
          <p className="text-sm text-muted-foreground">
            Опишите требования к&nbsp;вакансии
          </p>
        </header>

        <ScrollArea className="flex-1">
          <div
            className="space-y-4 p-4"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <output
                className="flex h-full min-h-[300px] items-center justify-center"
                aria-label="Пустое состояние чата"
              >
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Начните диалог</p>
                  <p className="mt-1 text-xs">
                    Например: "Нужен React разработчик с опытом 3+&nbsp;года"
                  </p>
                </div>
              </output>
            ) : (
              <>
                {messages.map((msg) => (
                  <VacancyChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                ))}
                {isGenerating && (
                  <output
                    className="flex gap-3 rounded-lg bg-muted/50 p-4"
                    aria-label="Ассистент печатает"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <div className="h-4 w-4 animate-pulse" aria-hidden="true">
                        ⋯
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-medium">Ассистент</span>
                      <p className="text-sm text-muted-foreground">
                        Генерирую документ…
                      </p>
                    </div>
                  </output>
                )}
                <div ref={messagesEndRef} aria-hidden="true" />
              </>
            )}
          </div>
        </ScrollArea>

        <VacancyChatInput
          onSendMessage={handleSendMessage}
          disabled={isGenerating}
        />
      </section>

      {/* Документ справа */}
      <section className="flex w-full flex-col md:w-1/2">
        <header className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Документ вакансии</h2>
            <p className="text-sm text-muted-foreground">
              Автоматически формируется на&nbsp;основе диалога
            </p>
          </div>
        </header>

        <div className="flex-1">
          <VacancyDocumentPreview
            document={document}
            workspaceId={workspaceId}
            onVacancyCreated={handleVacancyCreated}
            isCreating={isCreatingVacancy}
          />
        </div>
      </section>
    </div>
  );
}
