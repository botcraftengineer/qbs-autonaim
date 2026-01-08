"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  ScrollArea,
} from "@qbs-autonaim/ui";
import { Bot, MessageSquare, User } from "lucide-react";

type GigResponseDetail = RouterOutputs["gig"]["responses"]["get"];

interface InterviewDialogCardProps {
  conversation: NonNullable<GigResponseDetail["conversation"]>;
}

function formatMessageTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function InterviewDialogCard({
  conversation,
}: InterviewDialogCardProps) {
  if (!conversation?.messages || conversation.messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Диалог с кандидатом
          </CardTitle>
          <CardDescription>
            История переписки с кандидатом в процессе интервью
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Диалог еще не начат</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Диалог с кандидатом
        </CardTitle>
        <CardDescription>
          История переписки с кандидатом в процессе интервью
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {conversation.messages.map((message) => {
              const isBot = message.sender === "BOT";
              const isVoice = message.contentType === "VOICE";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isBot ? "flex-row" : "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      isBot ? "bg-primary/10" : "bg-muted",
                    )}
                  >
                    {isBot ? (
                      <Bot className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
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
                        "inline-block rounded-lg px-4 py-2 max-w-[80%]",
                        isBot
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {isVoice && message.voiceTranscription ? (
                        <div className="space-y-2">
                          <div className="text-xs opacity-70">
                            🎤 Голосовое сообщение
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.voiceTranscription}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-xs text-muted-foreground px-1",
                        isBot ? "text-left" : "text-right",
                      )}
                    >
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
