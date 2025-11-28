"use client";

import { Button, Input, ScrollArea } from "@selectio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VoicePlayer } from "~/components/chat/voice-player";
import { useTRPC } from "~/trpc/react";

export function ChatView({ conversationId }: { conversationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Получаем conversation по ID
  const conversationQueryOptions =
    trpc.telegram.conversation.getById.queryOptions({
      id: conversationId,
    });
  const { data: currentConversation } = useQuery(conversationQueryOptions);

  // Получаем responseId из metadata
  const metadata = currentConversation?.metadata
    ? JSON.parse(currentConversation.metadata)
    : null;
  const candidateResponseId = metadata?.responseId;

  // Получаем данные отклика
  const responseQueryOptions = trpc.vacancy.responses.getById.queryOptions({
    id: candidateResponseId ?? "",
  });
  const { data: responseData } = useQuery({
    ...responseQueryOptions,
    enabled: !!candidateResponseId,
  });

  // Получаем сообщения
  const {
    data: messages = [],
    isPending,
    error,
  } = useQuery({
    ...trpc.telegram.messages.getByConversationId.queryOptions({
      conversationId,
    }),
    enabled: !!conversationId,
  });

  // Отправка сообщения
  const sendMessageMutationOptions =
    trpc.telegram.sendMessage.send.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            ["telegram", "messages", "getByConversationId"],
            { input: { conversationId }, type: "query" },
          ],
        });
        setMessage("");
      },
    });

  const { mutate: sendMessage, isPending: isSending } = useMutation(
    sendMessageMutationOptions,
  );

  const handleSendMessage = () => {
    if (!message.trim() || !conversationId) return;

    sendMessage({
      conversationId,
      sender: "ADMIN",
      contentType: "TEXT",
      content: message,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  if (isPending) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка чата...</p>
        </div>
      </div>
    );
  }

  if (error || !currentConversation) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Ошибка</h2>
          <p className="text-muted-foreground">
            {error?.message ?? "Чат не найден"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1">
        {/* Заголовок */}
        <div className="border-b px-6 py-4">
          <h1 className="text-xl font-semibold">
            {currentConversation.candidateName}
          </h1>
          <p className="text-sm text-muted-foreground">
            @{currentConversation.chatId}
          </p>
        </div>

        {/* Сообщения */}
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => {
              const isAdmin = msg.sender === "ADMIN";
              const isBot = msg.sender === "BOT";

              const senderLabel = isAdmin
                ? "Вы"
                : isBot
                  ? "Бот"
                  : (currentConversation.candidateName ?? "Кандидат");

              const bgColor = isAdmin
                ? "bg-teal-500 text-white"
                : isBot
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-foreground";

              const timeColor = isAdmin
                ? "text-teal-100"
                : isBot
                  ? "text-blue-100"
                  : "text-muted-foreground";

              const isVoice = msg.contentType === "VOICE";
              const fileUrl =
                (msg as typeof msg & { fileUrl?: string | null }).fileUrl ||
                null;
              const voiceTranscription =
                (msg as typeof msg & { voiceTranscription?: string | null })
                  .voiceTranscription || null;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${bgColor}`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {senderLabel}
                    </p>
                    {isVoice && fileUrl ? (
                      <div className="space-y-2">
                        <VoicePlayer src={fileUrl} isOutgoing={isAdmin} />
                        {voiceTranscription && (
                          <div
                            className={`text-xs leading-relaxed pt-2 border-t ${
                              isAdmin
                                ? "border-teal-400/30"
                                : isBot
                                  ? "border-blue-400/30"
                                  : "border-border/50"
                            }`}
                          >
                            <p className="opacity-70 mb-1 font-medium">
                              Транскрипция:
                            </p>
                            <p className="opacity-90">{voiceTranscription}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${timeColor}`}>
                      {format(msg.createdAt, "HH:mm", { locale: ru })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Поле ввода */}
        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Введите сообщение..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Боковая панель с информацией о кандидате */}
      <div className="w-80 border-l overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Информация о кандидате */}
          <div>
            <h2 className="text-lg font-semibold mb-4">О кандидате</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Имя</p>
                <p className="text-sm font-medium">
                  {currentConversation.candidateName ?? "Не указано"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telegram</p>
                <p className="text-sm font-medium">
                  @{currentConversation.chatId}
                </p>
              </div>
              {responseData?.about && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">О себе</p>
                  <p className="text-sm">{responseData.about}</p>
                </div>
              )}
            </div>
          </div>

          {/* Скрининг */}
          {responseData?.screening && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Скрининг</h2>
              <div className="space-y-3">
                {responseData.screening.score !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Оценка</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full"
                          style={{
                            width: `${responseData.screening.score}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {responseData.screening.score}%
                      </span>
                    </div>
                  </div>
                )}
                {responseData.screening.analysis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Анализ</p>
                    <p className="text-sm">{responseData.screening.analysis}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Вакансия */}
          {responseData?.vacancy && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Вакансия</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Название</p>
                  <p className="text-sm font-medium">
                    {responseData.vacancy.title}
                  </p>
                </div>
                {responseData.vacancy.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Описание
                    </p>
                    <p className="text-sm line-clamp-3">
                      {responseData.vacancy.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Статус */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Статус</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Статус отклика
                </p>
                <p className="text-sm font-medium">
                  {responseData?.status ?? "Не указан"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Дата отклика
                </p>
                <p className="text-sm">
                  {responseData?.createdAt
                    ? format(responseData.createdAt, "dd MMMM yyyy, HH:mm", {
                        locale: ru,
                      })
                    : "Не указана"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
