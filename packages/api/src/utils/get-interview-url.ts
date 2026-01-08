import { env } from "@qbs-autonaim/config";
import { and, eq } from "@qbs-autonaim/db";
import type * as schema from "@qbs-autonaim/db/schema";
import { workspaceCustomDomain } from "@qbs-autonaim/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Получает primary interview domain для workspace
 */
async function getPrimaryInterviewDomain(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
): Promise<string | null> {
  const customDomain = await db.query.workspaceCustomDomain.findFirst({
    where: and(
      eq(workspaceCustomDomain.workspaceId, workspaceId),
      eq(workspaceCustomDomain.type, "interview"),
      eq(workspaceCustomDomain.isPrimary, true),
      eq(workspaceCustomDomain.isVerified, true),
    ),
    columns: {
      domain: true,
    },
  });

  return customDomain?.domain ?? null;
}

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

  const interviewUrl = env.NEXT_PUBLIC_INTERVIEW_URL;

  if (!interviewUrl || interviewUrl.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_INTERVIEW_URL environment variable is not set or empty. " +
        "Please configure it in your .env file.",
    );
  }

  return interviewUrl.replace(/\/$/, "");
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

/**
 * Генерирует полный URL интервью с токеном, получая домен из БД
 */
export async function getInterviewUrlFromDb(
  db: NodePgDatabase<typeof schema>,
  token: string,
  workspaceId: string,
): Promise<string> {
  const domain = await getPrimaryInterviewDomain(db, workspaceId);
  return getInterviewUrl(token, domain);
}
