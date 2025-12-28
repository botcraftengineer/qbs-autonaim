"use client";

import { useEffect, useRef, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { TypingIndicator } from "./typing-indicator";

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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Загружаем историю сообщений
  const { data: chatHistory, isLoading } =
    trpc.freelancePlatforms?.getChatHistory.useQuery({
      conversationId,
    });

  // Проверяем статус интервью с автоматическим переподключением
  const { data: interviewStatus, error: statusError } =
    trpc.freelancePlatforms?.getWebInterviewStatus.useQuery(
      {
        conversationId,
      },
      {
        refetchInterval: 2000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    );

  // Polling для новых сообщений с автоматическим переподключением
  const { data: newMessages, error: messagesError } =
    trpc.freelancePlatforms?.getNewMessages.useQuery(
      {
        conversationId,
        lastMessageId,
      },
      {
        refetchInterval: 2000,
        enabled: !!lastMessageId || messages.length > 0,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
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
  }, [messages]);

  const sendMessageMutation =
    trpc.freelancePlatforms?.sendChatMessage.useMutation({
      onSuccess: () => {
        setIsProcessing(true);
        setIsBotTyping(true);
      },
      onError: (error: Error) => {
        console.error("Failed to send message:", error);
        setIsProcessing(false);
        setIsBotTyping(false);
      },
    });

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
