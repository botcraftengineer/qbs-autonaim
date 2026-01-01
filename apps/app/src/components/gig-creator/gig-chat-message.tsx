"use client";

import { cn } from "@qbs-autonaim/ui";
import { Bot, User } from "lucide-react";

interface GigChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function GigChatMessage({
  role,
  content,
  timestamp,
}: GigChatMessageProps) {
  const isUser = role === "user";

  return (
    <article
      className={cn(
        "flex gap-3 rounded-lg p-4",
        isUser ? "bg-primary/5" : "bg-muted/50",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? "Вы" : "Ассистент"}
          </span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={timestamp.toISOString()}
          >
            {timestamp.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <p className="min-w-0 wrap-break-word whitespace-pre-wrap text-sm">
          {content}
        </p>
      </div>
    </article>
  );
}
