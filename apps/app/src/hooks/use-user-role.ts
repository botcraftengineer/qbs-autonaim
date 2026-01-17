"use client";

import { authClient } from "~/auth/client";

/**
 * Хук для получения роли текущего пользователя из сессии
 * Использует customSession плагин, роль загружается автоматически
 */
export function useUserRole() {
  const { data: session, isPending } = authClient.useSession();

  return {
    role: (session?.user as { role?: string } | undefined)?.role ?? "user",
    isAdmin: (session?.user as { role?: string } | undefined)?.role === "admin",
    isUser: (session?.user as { role?: string } | undefined)?.role === "user",
    isPending,
  };
}
