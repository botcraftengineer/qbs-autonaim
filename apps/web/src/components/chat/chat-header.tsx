"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@selectio/ui";
import { Button } from "@selectio/ui";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatHeaderProps {
  candidateName: string;
  candidateEmail?: string;
  avatarUrl?: string;
  onlineStatus?: "online" | "offline" | "typing";
}

export function ChatHeader({
  candidateName,
  candidateEmail,
  avatarUrl,
  onlineStatus = "offline",
}: ChatHeaderProps) {
  const router = useRouter();
  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusText = {
    online: "в сети",
    offline: candidateEmail || "был(а) недавно",
    typing: "печатает...",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 -ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={candidateName} />
        ) : (
          <AvatarFallback className="bg-teal-500 text-white font-medium">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[15px] leading-tight truncate">
          {candidateName}
        </h3>
        <p
          className={cn(
            "text-[13px] leading-tight truncate",
            onlineStatus === "online"
              ? "text-blue-500"
              : onlineStatus === "typing"
                ? "text-blue-500"
                : "text-gray-500 dark:text-gray-400"
          )}
        >
          {statusText[onlineStatus]}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="shrink-0">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
