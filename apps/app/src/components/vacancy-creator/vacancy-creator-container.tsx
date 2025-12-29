"use client";

import { ScrollArea } from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
}

export function VacancyCreatorContainer({
  workspaceId,
}: VacancyCreatorContainerProps) {
  const trpc = useTRPC();
  const [messages, setMessages] = useState<Message[]>([]);
  const [document, setDocument] = useState<VacancyDocument>({});

  const { mutate: generateVacancy, isPending } = useMutation(
    trpc.vacancy.chatGenerate.mutationOptions({
      onSuccess: (data: { document: VacancyDocument }) => {
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
      },
      onError: (error: Error) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Ошибка: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
      },
    }),
  );

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
    <div className="flex h-full gap-4">
      {/* Чат слева */}
      <div className="flex w-1/2 flex-col border-r">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Чат с ассистентом</h2>
          <p className="text-sm text-muted-foreground">
            Опишите требования к вакансии
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Начните диалог</p>
                  <p className="mt-1 text-xs">
                    Например: "Нужен React разработчик с опытом 3+ года"
                  </p>
                </div>
              </div>
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
                {isPending && (
                  <div className="flex gap-3 rounded-lg bg-muted/50 p-4">
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
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <VacancyChatInput
          onSendMessage={handleSendMessage}
          disabled={isPending}
        />
      </div>

      {/* Документ справа */}
      <div className="flex w-1/2 flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Документ вакансии</h2>
            <p className="text-sm text-muted-foreground">
              Автоматически формируется на основе диалога
            </p>
          </div>
        </div>

        <div className="flex-1">
          <VacancyDocumentPreview document={document} />
        </div>
      </div>
    </div>
  );
}
