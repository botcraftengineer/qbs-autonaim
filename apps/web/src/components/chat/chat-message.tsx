"use client";

import { Avatar, AvatarFallback, AvatarImage, cn } from "@selectio/ui";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Bot, Check, Shield, User } from "lucide-react";
import { VoicePlayer } from "./voice-player";

export type MessageSender = "bot" | "candidate" | "admin";

export interface ChatMessageProps {
  id: string;
  sender: MessageSender;
  content: string;
  contentType?: "TEXT" | "VOICE";
  fileUrl?: string | null;
  voiceTranscription?: string | null;
  timestamp: Date;
  senderName?: string;
  avatarUrl?: string;
}

const senderConfig = {
  bot: {
    icon: Bot,
    color: "bg-blue-500",
    align: "left" as const,
  },
  candidate: {
    icon: User,
    color: "bg-teal-500",
    align: "right" as const,
  },
  admin: {
    icon: Shield,
    color: "bg-purple-500",
    align: "left" as const,
  },
};

export function ChatMessage({
  sender,
  content,
  contentType = "TEXT",
  fileUrl,
  voiceTranscription,
  timestamp,
  senderName,
  avatarUrl,
}: ChatMessageProps) {
  const config = senderConfig[sender];
  const Icon = config.icon;
  const isOutgoing = config.align === "right";
  const isVoice = contentType === "VOICE";

  return (
    <div
      className={cn(
        "flex gap-2 mb-1 animate-in fade-in-50 slide-in-from-bottom-1 duration-200",
        isOutgoing && "flex-row-reverse",
      )}
    >
      {/* Avatar */}
      <Avatar className={cn("h-9 w-9 shrink-0 mt-1", isOutgoing && "order-2")}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={senderName} />
        ) : (
          <AvatarFallback className={cn(config.color, "text-white")}>
            <Icon className="h-5 w-5" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message bubble */}
      <div
        className={cn(
          "flex flex-col max-w-[70%] min-w-[120px]",
          isOutgoing && "items-end",
        )}
      >
        {/* Sender name (only for incoming messages) */}
        {!isOutgoing && senderName && (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5 px-3">
            {senderName}
          </span>
        )}

        {/* Message content */}
        <div
          className={cn(
            "relative rounded-2xl px-3 py-2 shadow-sm",
            isOutgoing
              ? "bg-teal-500 text-white rounded-tr-sm"
              : "bg-white dark:bg-gray-800 rounded-tl-sm",
          )}
        >
          {isVoice && fileUrl ? (
            <div className="space-y-2">
              <VoicePlayer src={fileUrl} isOutgoing={isOutgoing} />
              {voiceTranscription && (
                <div
                  className={cn(
                    "text-xs leading-relaxed pt-2 border-t",
                    isOutgoing
                      ? "border-white/20"
                      : "border-gray-200 dark:border-gray-700",
                  )}
                >
                  <p className="opacity-70 mb-1 font-medium">Транскрипция:</p>
                  <p className="opacity-90">{voiceTranscription}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[15px] leading-[1.4] whitespace-pre-wrap break-all">
              {content}
            </p>
          )}

          {/* Time and status */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1 justify-end",
              isOutgoing ? "text-white/70" : "text-gray-500 dark:text-gray-400",
            )}
          >
            <span className="text-[11px] leading-none">
              {format(timestamp, "HH:mm", { locale: ru })}
            </span>
            {isOutgoing && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </div>
        </div>
      </div>
    </div>
  );
}
