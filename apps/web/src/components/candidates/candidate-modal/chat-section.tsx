"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  ScrollArea,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface ChatSectionProps {
  candidateId: string;
  candidateName: string;
  workspaceId: string;
}

export function ChatSection({ candidateId, workspaceId }: ChatSectionProps) {
  const [messageText, setMessageText] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    ...trpc.candidates.listMessages.queryOptions({
      candidateId,
      workspaceId,
    }),
  }) as {
    data: Array<{
      id: string;
      content: string;
      sender: string;
      senderName: string;
      senderAvatar: string | null;
      timestamp: Date;
    }>;
  };

  const sendMessage = useMutation({
    ...trpc.candidates.sendMessage.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.listMessages.queryKey(),
      });
      setMessageText("");
      toast.success("Сообщение отправлено");
    },
    onError: () => {
      toast.error("Не удалось отправить сообщение");
    },
  });

  const handleSend = async () => {
    if (!messageText.trim()) return;
    sendMessage.mutate({
      candidateId,
      workspaceId,
      content: messageText.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Начните диалог с кандидатом</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "recruiter" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={message.senderAvatar ?? undefined}
                    alt={message.senderName}
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {message.senderName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${
                    message.sender === "recruiter" ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.sender === "recruiter"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-1">
                    {new Date(message.timestamp).toLocaleString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t pt-3">
        <div className="flex gap-2">
          <Input
            placeholder="Написать сообщение…"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendMessage.isPending}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            aria-label="Отправить сообщение"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
