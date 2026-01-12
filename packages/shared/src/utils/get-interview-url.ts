import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import type * as schema from "@qbs-autonaim/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Получает primary interview domain для workspace по customDomainId
 */
async function getWorkspaceInterviewDomain(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
): Promise<string | null> {
  const { workspace } = await import("@qbs-autonaim/db/schema");

  const ws = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: {
      customDomainId: true,
    },
    with: {
      customDomain: {
        columns: {
          domain: true,
          isVerified: true,
        },
      },
    },
  });

  if (!ws?.customDomain?.isVerified) {
    return null;
  }

  return ws.customDomain.domain;
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
  const domain = await getWorkspaceInterviewDomain(db, workspaceId);
  return getInterviewUrl(token, domain);
}
