"use client";

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Textarea,
  toast,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bot,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useTRPC } from "~/trpc/react";
import type { ConversationMessage, QuickReply, VacancyDocument } from "./types";
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
  const [inputValue, setInputValue] = useState("");
  const [showSettingsEdit, setShowSettingsEdit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Получаем настройки компании
  const { data: botSettings } = useQuery(
    trpc.workspace.getBotSettings.queryOptions({
      workspaceId,
    }),
  );

  const {
    document,
    messages,
    status,
    error,
    sendMessage,
    selectQuickReply,
    selectMultipleReplies,
    clearChat,
    retry,
  } = useAIVacancyChat({ workspaceId, botSettings });

  // Когда настройки компании созданы, автоматически переходим к следующему шагу
  React.useEffect(() => {
    if (botSettings?.companyName && messages.length === 1) {
      // Если есть настройки и только приветственное сообщение - перезагружаем чат
      clearChat();
    }
  }, [botSettings?.companyName, messages.length, clearChat]);

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

  // Mutation для обновления настроек компании
  const updateSettingsMutation = useMutation(
    trpc.workspace.updateBotSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Настройки обновлены");
        setShowSettingsEdit(false);
        // Инвалидируем кэш для обновления настроек
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getBotSettings.queryKey({ workspaceId }),
        });
        // Перезагружаем чат с новыми настройками
        clearChat();
      },
      onError: (err) => {
        toast.error("Ошибка обновления настроек", {
          description: err.message,
        });
      },
    }),
  );

  // Автоскролл к новым сообщениям внутри ScrollArea
  useEffect(() => {
    // Trigger scroll when messages array changes
    void messages.length;
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages.length]);

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
      bonuses: document.bonuses ?? "",
      customBotInstructions: document.customBotInstructions ?? "",
      customScreeningPrompt: document.customScreeningPrompt ?? "",
      customInterviewQuestions: document.customInterviewQuestions ?? "",
      customOrganizationalQuestions:
        document.customOrganizationalQuestions ?? "",
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
        {/* Company Settings Preview */}
        {botSettings && (
          <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    {botSettings.botName} • {botSettings.companyName}
                  </span>
                  {botSettings.companyWebsite && (
                    <span className="text-xs text-muted-foreground">
                      {botSettings.companyWebsite}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Показываем диалог редактирования настроек
                  setShowSettingsEdit(true);
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Редактировать настройки компании"
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
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
          className="min-h-0 flex-1"
          ref={scrollAreaRef}
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
                onMultiSelectSubmit={selectMultipleReplies}
                isLatest={msg.id === lastMessage?.id}
                disabled={isGenerating}
              />
            ))}

            {isGenerating && !lastMessage?.isStreaming && <TypingIndicator />}
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

      {/* Company Settings Edit Dialog */}
      <Dialog open={showSettingsEdit} onOpenChange={setShowSettingsEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Настройки компании</DialogTitle>
            <DialogDescription>
              Настройте параметры бота-рекрутера для вашей компании
            </DialogDescription>
          </DialogHeader>

          {botSettings && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = {
                  companyName: formData.get("companyName") as string,
                  companyDescription:
                    (formData.get("companyDescription") as string) || undefined,
                  companyWebsite:
                    (formData.get("companyWebsite") as string) || undefined,
                  botName: formData.get("botName") as string,
                  botRole: formData.get("botRole") as string,
                };

                updateSettingsMutation.mutate({
                  workspaceId,
                  data,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Название компании</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    defaultValue={botSettings.companyName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botName">Имя бота</Label>
                  <Input
                    id="botName"
                    name="botName"
                    defaultValue={botSettings.botName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Описание компании</Label>
                <Textarea
                  id="companyDescription"
                  name="companyDescription"
                  defaultValue={botSettings.companyDescription || ""}
                  placeholder="Расскажите о деятельности компании..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Сайт компании</Label>
                  <Input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    defaultValue={botSettings.companyWebsite || ""}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botRole">Роль бота</Label>
                  <Input
                    id="botRole"
                    name="botRole"
                    defaultValue={botSettings.botRole}
                    placeholder="HR-менеджер"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettingsEdit(false)}
                  disabled={updateSettingsMutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending
                    ? "Сохранение..."
                    : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ChatMessage({
  message,
  onQuickReplySelect,
  onMultiSelectSubmit,
  isLatest,
  disabled,
}: {
  message: ConversationMessage;
  onQuickReplySelect: (value: string) => void;
  onMultiSelectSubmit: (values: string[]) => Promise<void>;
  isLatest: boolean;
  disabled: boolean;
}) {
  const isUser = message.role === "user";
  const showQuickReplies =
    isLatest && !isUser && message.quickReplies && !disabled;
  const isMultiSelect = message.isMultiSelect && showQuickReplies;

  // Состояние для freeform полей
  const [freeformInputs, setFreeformInputs] = useState<Record<string, string>>(
    {},
  );
  const [activeFreeform, setActiveFreeform] = useState<string | null>(null);

  const handleFreeformToggle = (replyId: string) => {
    setActiveFreeform(activeFreeform === replyId ? null : replyId);
  };

  const handleFreeformSubmit = (replyId: string, reply: QuickReply) => {
    const customValue = freeformInputs[replyId]?.trim();
    if (customValue) {
      onQuickReplySelect(`${reply.value}: ${customValue}`);
      setActiveFreeform(null);
      setFreeformInputs((prev) => ({ ...prev, [replyId]: "" }));
    }
  };

  const handleFreeformInputChange = (replyId: string, value: string) => {
    setFreeformInputs((prev) => ({ ...prev, [replyId]: value }));
  };

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
        {showQuickReplies &&
          message.quickReplies &&
          (isMultiSelect ? (
            <MultiSelectReplies
              replies={message.quickReplies}
              onSubmit={onMultiSelectSubmit}
              disabled={disabled}
            />
          ) : (
            <div className="space-y-3 pt-2">
              {message.quickReplies.map((reply) => (
                <div key={reply.id} className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      reply.freeform
                        ? handleFreeformToggle(reply.id)
                        : onQuickReplySelect(reply.value)
                    }
                    disabled={disabled}
                    className="h-auto px-3 py-1.5 text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ touchAction: "manipulation" }}
                  >
                    {reply.freeform ? (
                      <>
                        {reply.label}
                        <span className="ml-1 text-muted-foreground">
                          {activeFreeform === reply.id ? "✏️" : "💬"}
                        </span>
                      </>
                    ) : (
                      reply.label
                    )}
                  </Button>

                  {/* Freeform input field */}
                  {reply.freeform && activeFreeform === reply.id && (
                    <div className="flex gap-2 ml-4">
                      <Textarea
                        value={freeformInputs[reply.id] || ""}
                        onChange={(e) =>
                          handleFreeformInputChange(reply.id, e.target.value)
                        }
                        placeholder={
                          reply.placeholder || "Опишите своими словами..."
                        }
                        maxLength={reply.maxLength || 1000}
                        className="min-h-[60px] text-xs resize-none"
                        disabled={disabled}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleFreeformSubmit(reply.id, reply);
                          }
                          if (e.key === "Escape") {
                            setActiveFreeform(null);
                          }
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleFreeformSubmit(reply.id, reply)}
                          disabled={
                            !freeformInputs[reply.id]?.trim() || disabled
                          }
                          className="px-2 py-1 h-6 text-xs"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveFreeform(null)}
                          className="px-2 py-1 h-6 text-xs"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </article>
  );
}

function MultiSelectReplies({
  replies,
  onSubmit,
  disabled,
}: {
  replies: QuickReply[];
  onSubmit: (values: string[]) => Promise<void>;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    onSubmit(Array.from(selected));
  };

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Выберите один или несколько вариантов:
      </p>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply) => {
          const isSelected = selected.has(reply.value);
          return (
            <button
              key={reply.id}
              type="button"
              onClick={() => toggleSelection(reply.value)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
              style={{ touchAction: "manipulation" }}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              {reply.label}
            </button>
          );
        })}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled || selected.size === 0}
        size="sm"
        className="transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ touchAction: "manipulation" }}
      >
        Подтвердить выбор ({selected.size})
      </Button>
    </div>
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
    !document.conditions &&
    !document.bonuses;

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

          {/* Структурированный документ вакансии */}
          <div className="space-y-6">
            {document.description && (
              <>
                <DocumentSection
                  title="Описание вакансии"
                  content={document.description}
                />
                <div className="text-center text-muted-foreground text-lg font-light">
                  —
                </div>
              </>
            )}

            {document.requirements && (
              <>
                <DocumentSection
                  title="Требования"
                  content={document.requirements}
                />
                <div className="text-center text-muted-foreground text-lg font-light">
                  —
                </div>
              </>
            )}

            {document.responsibilities && (
              <>
                <DocumentSection
                  title="Обязанности"
                  content={document.responsibilities}
                />
                <div className="text-center text-muted-foreground text-lg font-light">
                  —
                </div>
              </>
            )}

            {(document.conditions || document.bonuses) && (
              <>
                {document.conditions && (
                  <>
                    <DocumentSection
                      title="Условия"
                      content={document.conditions}
                    />
                    <div className="text-center text-muted-foreground text-lg font-light">
                      —
                    </div>
                  </>
                )}
                <DocumentSection
                  title="Премии и другие мотивационные выплаты"
                  content={
                    document.bonuses ||
                    (document.conditions
                      ? "Информация о премиях и мотивационных выплатах будет указана в условиях работы выше."
                      : "Премии и мотивационные выплаты не указаны.")
                  }
                />
              </>
            )}
          </div>

          {/* Дополнительные секции для внутренних нужд */}
          {(document.customBotInstructions ||
            document.customInterviewQuestions) && (
            <div className="mt-8 pt-6 border-t border-muted">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                Дополнительные настройки
              </h3>

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
            </div>
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
