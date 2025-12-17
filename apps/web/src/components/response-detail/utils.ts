export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(" ")
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase() || ""
  );
}

export function getAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6,8b5cf6,ec4899,f59e0b,10b981`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function getScoreBadgeVariant(
  score: number,
): "default" | "secondary" | "destructive" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}
