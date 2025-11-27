"use client";

import { Avatar, AvatarFallback } from "@selectio/ui";
import { Badge } from "@selectio/ui";
import { cn } from "@selectio/ui";
import { Bot, User, UserCog } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export type MessageSender = "bot" | "candidate" | "admin";

export interface ChatMessageProps {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  senderName?: string;
}

const senderConfig = {
  bot: {
    icon: Bot,
    label: "Бот",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeVariant: "default" as const,
    align: "left" as const,
  },
  candidate: {
    icon: User,
    label: "Кандидат",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    badgeVariant: "secondary" as const,
    align: "right" as const,
  },
  admin: {
    icon: UserCog,
    label: "Администратор",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeVariant: "outline" as const,
    align: "left" as const,
  },
};

export function ChatMessage({
  sender,
  content,
  timestamp,
  senderName,
}: ChatMessageProps) {
  const config = senderConfig[sender];
  const Icon = config.icon;
  const isRightAligned = config.align === "right";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-50 slide-in-from-bottom-2",
        isRightAligned && "flex-row-reverse"
      )}
    >
      <Avatar className={cn("h-8 w-8 shrink-0", config.bgColor)}>
        <AvatarFallback className={cn(config.bgColor, config.iconColor)}>
          <Icon className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[75%]",
          isRightAligned && "items-end"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            isRightAligned && "flex-row-reverse"
          )}
        >
          <Badge variant={config.badgeVariant} className="text-xs">
            {senderName || config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(timestamp, "HH:mm", { locale: ru })}
          </span>
        </div>

        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm leading-relaxed",
            sender === "bot" &&
              "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900",
            sender === "candidate" &&
              "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            sender === "admin" &&
              "bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900"
          )}
        >
          <p className="whitespace-pre-wrap wrap-break-word">{content}</p>
        </div>
      </div>
    </div>
  );
}
