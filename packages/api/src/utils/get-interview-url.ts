import { env } from "@qbs-autonaim/config";

/**
 * Получает базовый URL для интервью
 * Использует кастомный домен workspace, если он указан, иначе NEXT_PUBLIC_INTERVIEW_URL
 */
export function getInterviewBaseUrl(
  workspaceInterviewDomain?: string | null,
): string {
  if (workspaceInterviewDomain) {
    // Убираем trailing slash если есть
    return workspaceInterviewDomain.replace(/\/$/, "");
  }

  return env.NEXT_PUBLIC_INTERVIEW_URL.replace(/\/$/, "");
}

/**
 * Генерирует полный URL интервью с токеном
 */
export function getInterviewUrl(
  token: string,
  workspaceInterviewDomain?: string | null,
): string {
  const baseUrl = getInterviewBaseUrl(workspaceInterviewDomain);
  return `${baseUrl}/${token}`;
}
