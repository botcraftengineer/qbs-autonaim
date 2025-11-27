"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Separator, cn } from "@selectio/ui";
import { ScrollArea } from "./scroll-area";
import { ChatMessage, type ChatMessageProps } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";

interface ChatContainerProps {
  candidateName: string;
  candidateEmail?: string;
  messages: ChatMessageProps[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function ChatContainer({
  candidateName,
  candidateEmail,
  messages,
  onSendMessage,
  isLoading = false,
  className,
}: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesLength = messages.length;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messagesLength]);

  const handleSendMessage = async (message: string) => {
    setIsSending(true);
    try {
      await onSendMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <ChatHeader
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        messageCount={messages.length}
      />

      <Separator />

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Пока нет сообщений</p>
                <p className="text-xs mt-1">Начните диалог с кандидатом</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} {...message} />
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isSending || isLoading}
          placeholder="Напишите сообщение кандидату..."
        />
      </div>
    </Card>
  );
}
