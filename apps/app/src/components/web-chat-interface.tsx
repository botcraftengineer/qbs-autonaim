"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "~/components/chat-header";
import { ChatInput } from "~/components/chat-input";
import { ChatMessageList } from "~/components/chat-message-list";
import { TypingIndicator } from "~/components/typing-indicator";
import { useTRPC } from "~/trpc/react";

interface WebChatInterfaceProps {
  conversationId: string;
}

interface ChatMessage {
  id: string;
  sender: "BOT" | "CANDIDATE" | "ADMIN";
  content: string;
  contentType: "TEXT" | "VOICE";
  createdAt: Date;
}

export function WebChatInterface({ conversationId }: WebChatInterfaceProps) {
  const trpc = useTRPC();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | undefined>();
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Загружаем историю сообщений
  const { data: chatHistory, isLoading } = useQuery(
    trpc.freelancePlatforms.getChatHistory.queryOptions({
      conversationId,
    }),
  );

  // Проверяем статус интервью с автоматическим переподключением
  const { data: interviewStatus, error: statusError } = useQuery(
    trpc.freelancePlatforms.getWebInterviewStatus.queryOptions(
      {
        conversationId,
      },
      {
        refetchInterval: 2000,
        retry: 3,
        retryDelay: (attemptIndex: number) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    ),
  );

  // Polling для новых сообщений с автоматическим переподключением
  const { data: newMessages, error: messagesError } = useQuery(
    trpc.freelancePlatforms.getNewMessages.queryOptions(
      {
        conversationId,
        lastMessageId,
      },
      {
        refetchInterval: 2000,
        enabled: !!lastMessageId || messages.length > 0,
        retry: 3,
        retryDelay: (attemptIndex: number) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    ),
  );

  // Отслеживаем состояние подключения
  useEffect(() => {
    const hasError = !!statusError || !!messagesError;
    setIsOnline(!hasError);

    if (hasError) {
      // Автоматическое переподключение через 5 секунд
      reconnectTimeoutRef.current = setTimeout(() => {
        setIsOnline(true);
      }, 5000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [statusError, messagesError]);

  // Загружаем историю при монтировании
  useEffect(() => {
    if (chatHistory?.messages) {
      setMessages(chatHistory.messages);
      const lastMsg = chatHistory.messages[chatHistory.messages.length - 1];
      if (lastMsg) {
        setLastMessageId(lastMsg.id);
      }
    }
  }, [chatHistory]);

  // Добавляем новые сообщения от бота
  useEffect(() => {
    if (newMessages?.messages && newMessages.messages.length > 0) {
      setMessages((prev) => {
        const newMsgs = newMessages.messages.filter(
          (msg: { id: string }) => !prev.some((m) => m.id === msg.id),
        );
        if (newMsgs.length > 0) {
          setIsBotTyping(false);
          setIsProcessing(false);
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg) {
            setLastMessageId(lastMsg.id);
          }
        }
        return [...prev, ...newMsgs];
      });
    }
  }, [newMessages]);

  // Обновляем состояние обработки на основе статуса буфера
  useEffect(() => {
    if (interviewStatus?.hasActiveBuffer) {
      setIsProcessing(true);
      setIsBotTyping(true);
    }
  }, [interviewStatus?.hasActiveBuffer]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessageMutation = useMutation(
    trpc.freelancePlatforms?.sendChatMessage.mutationOptions({
      onSuccess: () => {
        setIsProcessing(true);
        setIsBotTyping(true);
      },
      onError: (error) => {
        console.error("Failed to send message:", error);
        setIsProcessing(false);
        setIsBotTyping(false);
      },
    }),
  );

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    // Оптимистично добавляем сообщение пользователя
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "CANDIDATE",
      content: message,
      contentType: "TEXT",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Отправляем сообщение на сервер
    await sendMessageMutation.mutateAsync({
      conversationId,
      message,
    });
  };

  const isCompleted = chatHistory?.status === "COMPLETED";
  const isCancelled = chatHistory?.status === "CANCELLED";

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        status={chatHistory?.status || "ACTIVE"}
        isProcessing={isProcessing}
      />

      {!isOnline && (
        <div className="bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          Переподключение…
        </div>
      )}

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
      />

      {isBotTyping && <TypingIndicator />}

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isProcessing || isCompleted || isCancelled || !isOnline}
        isProcessing={isProcessing}
      />
    </div>
  );
}
