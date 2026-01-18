"use client";

import { ScrollArea } from "@qbs-autonaim/ui";
import { Bot, User } from "lucide-react";
import { cn } from "@qbs-autonaim/ui";

interface Message {
  id: string;
  sender: string;
  content: string;
  contentType: string;
  voiceTranscription: string | null;
  createdAt: Date;
}

interface Conversation {
  id: string;
  status: string;
  messages: Message[];
}

interface DialogTabProps {
  conversation: Conversation;
}

export function DialogTab({ conversation }: DialogTabProps) {
  return (
    <ScrollArea className="h-[400px] sm:h-[600px] pr-2 sm:pr-4">
      <div className="space-y-3 sm:space-y-4">
        {conversation.messages.map((message) => {
          const isBot = message.sender === "BOT";
          const isVoice = message.contentType === "VOICE";

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 sm:gap-3",
                isBot ? "flex-row" : "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full",
                  isBot ? "bg-primary/10" : "bg-muted",
                )}
              >
                {isBot ? (
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                ) : (
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
              </div>

              <div
                className={cn(
                  "flex-1 space-y-1",
                  isBot ? "items-start" : "items-end",
                )}
              >
                <div
                  className={cn(
                    "inline-block rounded-2xl px-3 py-2 sm:px-4 sm:py-2 max-w-[85%] sm:max-w-[80%] shadow-sm",
                    isBot
                      ? "bg-muted text-foreground border border-border/50"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {isVoice && message.voiceTranscription ? (
                    <div className="space-y-2">
                      <div className="text-xs opacity-70">
                        Голосовое сообщение
                      </div>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                        {message.voiceTranscription}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "text-xs px-1",
                    isBot ? "text-left" : "text-right",
                    isBot
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70",
                  )}
                >
                  {new Intl.DateTimeFormat("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(message.createdAt))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
