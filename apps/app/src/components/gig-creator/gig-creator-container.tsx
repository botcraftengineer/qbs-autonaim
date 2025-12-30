"use client";

import { ScrollArea } from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { GigChatInput } from "./gig-chat-input";
import { GigChatMessage } from "./gig-chat-message";
import { GigDocumentPreview } from "./gig-document-preview";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GigDocument {
  title?: string;
  description?: string;
  deliverables?: string;
  requiredSkills?: string;
  budgetRange?: string;
  timeline?: string;
}

interface GigCreatorContainerProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function GigCreatorContainer({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: GigCreatorContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [document, setDocument] = useState<GigDocument>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(false);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: createGig, isPending: isCreatingGig } = useMutation(
    trpc.gig.create.mutationOptions({
      onSuccess: (gig: { id: string }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.list.queryKey(),
        });
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`,
        );
      },
      onError: (error) => {
        if (!isMountedRef.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Ошибка создания задания: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
      },
    }),
  );

  const { mutateAsync: generateGig } = useMutation(
    trpc.gig.chatGenerate.mutationOptions({
      onSuccess: (result) => {
        if (!isMountedRef.current) return;

        setDocument(result.document);
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
      onError: (error) => {
        if (!isMountedRef.current) return;

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

  const handleGigCreated = () => {
    if (!document.title) return;

    createGig({
      workspaceId,
      title: document.title,
      description: document.description,
      deliverables: document.deliverables,
      requiredSkills: document.requiredSkills,
    });
  };

  // Cleanup при размонтировании
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Автоскролл к новым сообщениям
  useEffect(() => {
    if (messages.length > 0 || isGenerating) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isGenerating]);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      await generateGig({
        workspaceId,
        message,
        currentDocument: document,
        conversationHistory,
      });
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* Чат слева */}
      <section className="flex w-full flex-col border-b md:w-1/2 md:border-b-0 md:border-r">
        <header className="border-b p-4">
          <h2 className="text-lg font-semibold">Чат с&nbsp;ассистентом</h2>
          <p className="text-sm text-muted-foreground">
            Опишите задание для фрилансера
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
                    Например: "Нужен дизайн лендинга для IT-стартапа"
                  </p>
                </div>
              </output>
            ) : (
              <>
                {messages.map((msg) => (
                  <GigChatMessage
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

        <GigChatInput
          onSendMessage={handleSendMessage}
          disabled={isGenerating}
        />
      </section>

      {/* Документ справа */}
      <section className="flex w-full flex-col md:w-1/2">
        <header className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Документ задания</h2>
            <p className="text-sm text-muted-foreground">
              Автоматически формируется на&nbsp;основе диалога
            </p>
          </div>
        </header>

        <div className="flex-1">
          <GigDocumentPreview
            document={document}
            onGigCreated={handleGigCreated}
            isCreating={isCreatingGig}
          />
        </div>
      </section>
    </div>
  );
}
