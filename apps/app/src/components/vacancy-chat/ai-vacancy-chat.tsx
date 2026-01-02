"use client";

import {
  Button,
  Card,
  cn,
  ScrollArea,
  Textarea,
  toast,
} from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Bot,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTRPC } from "~/trpc/react";
import type { ConversationMessage, VacancyDocument } from "./types";
import { useAIVacancyChat } from "./use-ai-vacancy-chat";

interface AIVacancyChatProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function AIVacancyChat({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: AIVacancyChatProps) {
  const {
    document,
    messages,
    status,
    error,
    sendMessage,
    selectQuickReply,
    clearChat,
    retry,
  } = useAIVacancyChat({ workspaceId });

  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const trpc = useTRPC();

  // Mutation для сохранения вакансии
  const createVacancyMutation = useMutation(
    trpc.vacancy.createFromChat.mutationOptions({
      onSuccess: (vacancy) => {
        toast.success("Вакансия создана", {
          description: "Вакансия успешно сохранена",
        });
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancy.id}`,
        );
      },
      onError: (err) => {
        toast.error("Ошибка сохранения", {
          description: err.message,
        });
      },
    }),
  );

  // Автоскролл к новым сообщениям
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  });

  // Автофокус на десктопе
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
  }, []);

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || status === "streaming" || status === "loading") return;

    setInputValue("");
    await sendMessage(message);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setInputValue("");
      textareaRef.current?.blur();
    }
  };

  const handleSave = () => {
    if (!document.title) return;

    createVacancyMutation.mutate({
      workspaceId,
      title: document.title,
      description: document.description ?? "",
      requirements: document.requirements ?? "",
      responsibilities: document.responsibilities ?? "",
      conditions: document.conditions ?? "",
      customBotInstructions: document.customBotInstructions,
      customScreeningPrompt: document.customScreeningPrompt,
      customInterviewQuestions: document.customInterviewQuestions,
      customOrganizationalQuestions: document.customOrganizationalQuestions,
    });
  };

  const isGenerating = status === "loading" || status === "streaming";
  const isSaving = createVacancyMutation.isPending;
  const hasMinimalContent = !!document.title;
  const lastMessage = messages[messages.length - 1];

  return (
    <main className="flex h-full flex-col gap-0 md:flex-row">
      {/* Chat Section */}
      <section
        className="flex h-[50vh] w-full flex-col border-b md:h-full md:w-1/2 md:border-b-0 md:border-r lg:w-2/5"
        aria-label="Чат с AI-ассистентом"
      >
        <header className="flex items-center justify-between border-b p-3 md:p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold md:text-lg">
                AI-ассистент
              </h2>
              <p className="text-xs text-muted-foreground">Создание вакансии</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            disabled={isGenerating}
            className="h-8 w-8"
            aria-label="Начать заново"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea
          className="flex-1"
          ref={chatContainerRef}
          style={{ overscrollBehavior: "contain" }}
        >
          <div
            className="space-y-3 p-3 md:space-y-4 md:p-4"
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onQuickReplySelect={selectQuickReply}
                isLatest={msg.id === lastMessage?.id}
                disabled={isGenerating}
              />
            ))}

            {isGenerating && !lastMessage?.isStreaming && <TypingIndicator />}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="border-t bg-destructive/10 p-3" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium text-destructive">
                  {error.message}
                </p>
                {error.retryable && (
                  <Button onClick={retry} size="sm" variant="outline">
                    Повторить
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t bg-background p-3 md:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Опишите вакансию или выберите вариант выше…"
                disabled={isGenerating}
                className="min-h-[60px] resize-none pr-12 text-base md:min-h-[80px]"
                style={{ fontSize: "16px", touchAction: "manipulation" }}
                autoComplete="off"
                name="vacancy-message"
                aria-label="Сообщение"
              />
              <Button
                type="submit"
                disabled={isGenerating || !inputValue.trim()}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full transition-all hover:scale-105 active:scale-95 md:h-9 md:w-9"
                style={{ touchAction: "manipulation" }}
                aria-label={isGenerating ? "Генерация…" : "Отправить"}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Enter — отправить, Shift&nbsp;+&nbsp;Enter — новая строка
            </p>
          </form>
        </div>
      </section>

      {/* Document Preview */}
      <section
        className="flex h-[50vh] w-full flex-col md:h-full md:w-1/2 lg:w-3/5"
        aria-label="Документ вакансии"
      >
        <header className="border-b p-3 md:p-4">
          <h2 className="text-base font-semibold md:text-lg">
            Документ вакансии
          </h2>
          <p className="text-xs text-muted-foreground md:text-sm">
            Обновляется в&nbsp;реальном времени
          </p>
        </header>

        <DocumentPreview
          document={document}
          hasMinimalContent={hasMinimalContent}
          onSave={handleSave}
          isSaving={isSaving}
          isGenerating={isGenerating}
        />
      </section>
    </main>
  );
}

function ChatMessage({
  message,
  onQuickReplySelect,
  isLatest,
  disabled,
}: {
  message: ConversationMessage;
  onQuickReplySelect: (value: string) => void;
  isLatest: boolean;
  disabled: boolean;
}) {
  const isUser = message.role === "user";
  const showQuickReplies =
    isLatest && !isUser && message.quickReplies && !disabled;

  return (
    <article
      className={cn(
        "flex gap-2 rounded-lg p-3 transition-all duration-200 md:gap-3 md:p-4",
        "animate-in fade-in slide-in-from-bottom-2",
        isUser ? "bg-primary/5" : "bg-muted/50",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full md:h-8 md:w-8",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
        ) : (
          <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <span className="text-xs font-medium md:text-sm">
            {isUser ? "Вы" : "Ассистент"}
          </span>
          {message.isStreaming ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Генерирую…</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-xs leading-relaxed md:text-sm">
              {message.content}
            </p>
          )}
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="flex flex-wrap gap-2 pt-2">
            {message.quickReplies?.map((reply) => (
              <Button
                key={reply.id}
                variant="outline"
                size="sm"
                onClick={() => onQuickReplySelect(reply.value)}
                disabled={disabled}
                className="h-auto px-3 py-1.5 text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ touchAction: "manipulation" }}
              >
                {reply.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 rounded-lg bg-muted/50 p-3 md:gap-3 md:p-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted md:h-8 md:w-8">
        <Loader2 className="h-3.5 w-3.5 animate-spin md:h-4 md:w-4" />
      </div>
      <div className="flex-1">
        <span className="text-xs font-medium md:text-sm">Ассистент</span>
        <p className="text-xs text-muted-foreground md:text-sm">Думаю…</p>
      </div>
    </div>
  );
}

function DocumentPreview({
  document,
  hasMinimalContent,
  onSave,
  isSaving,
  isGenerating,
}: {
  document: VacancyDocument;
  hasMinimalContent: boolean;
  onSave: () => void;
  isSaving: boolean;
  isGenerating: boolean;
}) {
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.requirements &&
    !document.responsibilities &&
    !document.conditions;

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 md:h-12 md:w-12" />
          <h3 className="mt-3 text-base font-medium md:mt-4 md:text-lg">
            Документ пуст
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
            Начните диалог с ассистентом,
            <br />и документ появится здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1" style={{ overscrollBehavior: "contain" }}>
        <article className="space-y-4 p-4 md:space-y-6 md:p-6">
          {document.title && (
            <header>
              <h1 className="text-xl font-bold md:text-2xl">
                {document.title}
              </h1>
            </header>
          )}

          {document.description && (
            <DocumentSection
              title="О компании"
              content={document.description}
            />
          )}

          {document.requirements && (
            <DocumentSection
              title="Требования"
              content={document.requirements}
            />
          )}

          {document.responsibilities && (
            <DocumentSection
              title="Обязанности"
              content={document.responsibilities}
            />
          )}

          {document.conditions && (
            <DocumentSection title="Условия" content={document.conditions} />
          )}

          {document.customBotInstructions && (
            <DocumentSection
              title="Инструкции для бота"
              content={document.customBotInstructions}
            />
          )}

          {document.customInterviewQuestions && (
            <DocumentSection
              title="Вопросы для интервью"
              content={document.customInterviewQuestions}
            />
          )}
        </article>
      </ScrollArea>

      {hasMinimalContent && (
        <div className="border-t p-3 md:p-4">
          <Button
            onClick={onSave}
            disabled={isSaving || isGenerating}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
            style={{ touchAction: "manipulation" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создаю…
              </>
            ) : isGenerating ? (
              "Дождитесь завершения генерации"
            ) : (
              "Создать вакансию"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function DocumentSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <Card className="p-3 transition-all duration-300 md:p-4">
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-2 md:text-sm">
        {title}
      </h2>
      <div className="whitespace-pre-wrap text-xs leading-relaxed md:text-sm">
        {content}
      </div>
    </Card>
  );
}
