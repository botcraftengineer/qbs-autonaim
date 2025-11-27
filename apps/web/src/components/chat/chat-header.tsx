"use client";

import { Avatar, AvatarFallback } from "@selectio/ui";
import { Badge } from "@selectio/ui";
import { MessageCircle } from "lucide-react";

interface ChatHeaderProps {
  candidateName: string;
  candidateEmail?: string;
  messageCount: number;
}

export function ChatHeader({
  candidateName,
  candidateEmail,
  messageCount,
}: ChatHeaderProps) {
  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-linear-to-br from-purple-500 to-blue-500 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base truncate">{candidateName}</h3>
          <Badge variant="secondary" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            {messageCount}
          </Badge>
        </div>
        {candidateEmail && (
          <p className="text-sm text-muted-foreground truncate">
            {candidateEmail}
          </p>
        )}
      </div>
    </div>
  );
}
