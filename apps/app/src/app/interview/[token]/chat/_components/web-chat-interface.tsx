"use client";

import { useEffect, useRef, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { TypingIndicator } from "./typing-indicator";

interface WebChatInterfaceProps {
  conversationId: string;
  token: string;
}

export function WebChatInterface({
  conversationId,
  token,
}: WebChatInterfaceProps) {
  const trpc = useTRPC();
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      sender: "BOT" | "CANDIDATE" | "ADMIN";
      content: string;
      contentType: "TEXT" | "VOICE";
      createdAt: Date;
    }>
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загружаем историю сообщений
  const { data: chatHistory, isLoading } =
    trpc.freelancePlatforms.getChatHistory.useQuery({
      conversationId,
    });

  // Проверяем статус интервью
  const { data: interviewStatus } =
    trpc.freelancePlatforms.getWebInterviewStatus.useQuery(
      {
        conversationId,
      },
      {
        refetchInterval: 2000, // Проверяем каждые 2 секунды
      },
    );

  // Polling для новых сообщений от бота
  const { data: newMessages } = trpc.freelancePlatforms.getNewMessages.useQuery(
    {
      conversationId,
      lastMessageId,
    },
    {
      refetchInterval: 2000, // Проверяем каждые 2 секунды
      enabled: !!lastMessageId || messages.length > 0,
    },
  );

  // Загружаем историю при монтировании
  useEffect(() => {
    if (chatHistory?.messages) {
      setMessages(chatHistory.messages);
      // Устанавливаем последнее сообщение для polling
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
          (msg) => !prev.some((m) => m.id === msg.id),
        );
        if (newMsgs.length > 0) {
          setIsBotTyping(false);
          setIsProcessing(false);
          // Обновляем lastMessageId
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
  }, [messages, isBotTyping]);

  const sendMessageMutation =
    trpc.freelancePlatforms.sendChatMessage.useMutation({
      onSuccess: () => {
        setIsProcessing(true);
        setIsBotTyping(true);
      },
      onError: (error) => {
        console.error("Failed to send message:", error);
        setIsProcessing(false);
        setIsBotTyping(false);
      },
    });

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    // Оптимистично добавляем сообщение пользователя
    const userMessage = {
      id: `temp-${Date.now()}`,
      sender: "CANDIDATE" as const,
      content: message,
      contentType: "TEXT" as const,
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

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
      />

      {isBotTyping && <TypingIndicator />}

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isProcessing || isCompleted || isCancelled}
        isProcessing={isProcessing}
      />
    </div>
  );
}
