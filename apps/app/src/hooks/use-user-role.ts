"use client";

import { authClient } from "~/auth/client";

/**
 * Хук для получения роли текущего пользователя из сессии
 * Использует customSession плагин, роль загружается автоматически
 */
export function useUserRole() {
  const { data: session, isPending } = authClient.useSession();

  return {
    role: session?.role ?? "user",
    isAdmin: session?.role === "admin",
    isUser: session?.role === "user",
    isPending,
  };
}
