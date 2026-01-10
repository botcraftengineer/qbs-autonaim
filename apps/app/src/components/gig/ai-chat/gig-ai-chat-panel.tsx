"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@qbs-autonaim/ui";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { QuickReplies } from "./quick-replies";
import { TypingIndicator } from "./typing-indicator";

interface GigAIChatPanelProps {
  gigId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  createdAt: Date;
}

/**
 * GigAIChatPanel - Main AI chat panel for gig candidate analysis
 * Requirements: 8.1
 * Subtask 7.1: Sheet/Drawer component with header, state management, and history loading
 */
export function GigAIChatPanel({
  gigId,
  isOpen,
  onClose,
}: GigAIChatPanelProps) {
  const trpc = useTRPC();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history when panel opens
  const historyQuery = trpc.gig.aiChat.getHistory.useQuery(
    { gigId, limit: 50 },
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
    },
  );

  // Update messages when history loads
  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages as ChatMessage[]);
    }
  }, [historyQuery.data]);

  // Send message mutation
  const sendMessageMutation = trpc.gig.aiChat.sendMessage.useMutation({
    onMutate: async (variables: { gigId: string; message: string }) => {
      // Optimistic update: add user message immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: variables.message,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data: {
      message: string;
      quickReplies: string[];
      metadata: unknown;
    }) => {
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.message,
        quickReplies: data.quickReplies,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    },
    onError: (err: { message: string }) => {
      setError(err.message);
      setIsLoading(false);
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  // Clear history mutation
  const clearHistoryMutation = trpc.gig.aiChat.clearHistory.useMutation({
    onSuccess: () => {
      setMessages([]);
      setError(null);
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate({ gigId, message });
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Вы уверены, что хотите очистить историю чата? Это действие нельзя отменить.",
      )
    ) {
      clearHistoryMutation.mutate({ gigId });
    }
  };

  // Get last message's quick replies
  const lastMessage = messages[messages.length - 1];
  const showQuickReplies =
    lastMessage?.role === "assistant" &&
    lastMessage.quickReplies &&
    lastMessage.quickReplies.length > 0 &&
    !isLoading;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        aria-label="AI помощник для анализа кандидатов"
      >
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>AI Помощник</SheetTitle>
              <SheetDescription>
                Задавайте вопросы о кандидатах и получайте аналитику
              </SheetDescription>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearHistoryMutation.isPending}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-50"
                aria-label="Очистить историю чата"
              >
                Очистить
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatMessageList
            messages={messages}
            isLoading={historyQuery.isLoading}
          />

          {isLoading && <TypingIndicator />}

          {showQuickReplies && lastMessage.quickReplies && (
            <QuickReplies
              replies={lastMessage.quickReplies}
              onSelect={handleQuickReply}
              disabled={isLoading}
            />
          )}

          {error && (
            <div
              className="border-t bg-destructive/10 p-3"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Спросите о кандидатах…"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
