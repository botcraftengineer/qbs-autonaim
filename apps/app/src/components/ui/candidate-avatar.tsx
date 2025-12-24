"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@qbs-autonaim/ui";

interface CandidateAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase() || "?";
  }

  const first = parts[0]?.charAt(0) || "";
  const last = parts[parts.length - 1]?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

function getDiceBearUrl(name?: string | null): string {
  const seed = name || "anonymous";
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&scale=50`;
}

export function CandidateAvatar({
  name,
  photoUrl,
  className,
}: CandidateAvatarProps) {
  const initials = getInitials(name);
  const fallbackUrl = getDiceBearUrl(name);

  return (
    <Avatar className={className}>
      <AvatarImage src={photoUrl || fallbackUrl} alt={name || "Кандидат"} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
