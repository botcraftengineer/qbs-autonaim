"use client";

import { cn } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAIChatStream } from "~/hooks/use-ai-chat-stream";
import { useTRPC } from "~/trpc/react";
import { convertLegacyMessage } from "~/types/ai-chat";
import { AIChatInput } from "./ai-chat-input";
import { AIMessages } from "./ai-messages";

function InterviewGreeting() {
  return (
    <div className="mx-auto mt-8 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20"
      >
        <Sparkles className="size-6 text-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-semibold text-xl md:text-2xl"
      >
        Добро пожаловать!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-1 text-muted-foreground text-xl md:text-2xl"
      >
        Готовы начать интервью?
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-muted-foreground text-sm"
      >
        Напишите сообщение, чтобы начать диалог с AI-ассистентом
      </motion.p>
    </div>
  );
}

interface InterviewChatProps {
  conversationId: string;
  apiEndpoint?: string;
  className?: string;
}

export function InterviewChat({
  conversationId,
  apiEndpoint = "/api/chat/stream",
  className,
}: InterviewChatProps) {
  const trpc = useTRPC();
  const [isOnline, setIsOnline] = useState(true);
  const isInitializedRef = useRef(false);
  const currentConversationIdRef = useRef(conversationId);

  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery(
    trpc.freelancePlatforms.getChatHistory.queryOptions({ conversationId }),
  );

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
    onError: () => setIsOnline(false),
  });

  // Синхронизация initialMessages
  useEffect(() => {
    if (currentConversationIdRef.current !== conversationId) {
      isInitializedRef.current = false;
      currentConversationIdRef.current = conversationId;
    }
    if (!isInitializedRef.current && initialMessages.length > 0) {
      setMessages(initialMessages);
      isInitializedRef.current = true;
    }
  }, [conversationId, initialMessages, setMessages]);

  // Online/offline
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

  const status = chatHistory?.status || "ACTIVE";
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const isReadonly = isCompleted || isCancelled;

  if (isLoadingHistory) {
    return (
      <div
        className={cn("flex h-dvh min-w-0 flex-col bg-background", className)}
      >
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Загрузка…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-dvh min-w-0 touch-pan-y flex-col bg-background",
        className,
      )}
    >
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b bg-background px-4 py-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-medium text-sm">AI Интервью</h1>
          <p className="text-muted-foreground text-xs">
            {isCompleted && "Завершено"}
            {isCancelled && "Отменено"}
            {!isReadonly && (isOnline ? "Онлайн" : "Переподключение…")}
          </p>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <p>{error.message}</p>
        </div>
      )}

      <AIMessages
        messages={messages}
        status={chatStatus}
        isReadonly={isReadonly}
        emptyStateComponent={<InterviewGreeting />}
      />

      <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 bg-background px-2 pb-3 md:px-4 md:pb-4">
        {!isReadonly && (
          <AIChatInput
            onSendMessage={sendMessage}
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
      </div>

      {isReadonly && (
        <div className="border-t bg-muted/30 px-4 py-3 text-center text-muted-foreground text-sm">
          {isCompleted && "Интервью завершено. Спасибо за участие!"}
          {isCancelled && "Интервью было отменено."}
        </div>
      )}
    </div>
  );
}
