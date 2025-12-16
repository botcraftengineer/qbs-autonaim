/**
 * Управление сессиями Telegram в базе данных
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramSession } from "@qbs-autonaim/db/schema";

/**
 * Помечает сессию как недействительную в базе данных
 */
export async function markSessionAsInvalid(
  sessionId: string,
  errorType: string,
  _errorMessage: string,
): Promise<void> {
  await db
    .update(telegramSession)
    .set({
      isActive: false,
      authError: errorType,
      authErrorAt: new Date(),
    })
    .where(eq(telegramSession.id, sessionId));

  console.log(
    `📛 Сессия ${sessionId} помечена как недействительная: ${errorType}`,
  );
}

/**
 * Получает все активные сессии из базы данных
 */
export async function getActiveSessions(): Promise<
  (typeof telegramSession.$inferSelect)[]
> {
  return db
    .select()
    .from(telegramSession)
    .where(eq(telegramSession.isActive, true));
}

/**
 * Получает сессию по workspaceId
 */
export async function getSessionByWorkspace(
  workspaceId: string,
): Promise<typeof telegramSession.$inferSelect | undefined> {
  const [session] = await db
    .select()
    .from(telegramSession)
    .where(eq(telegramSession.workspaceId, workspaceId))
    .limit(1);

  return session;
}

/**
 * Сохраняет данные сессии (включая кэш peers) в базу данных
 */
export async function saveSessionData(
  sessionId: string,
  sessionData: Record<string, string>,
): Promise<void> {
  try {
    await db
      .update(telegramSession)
      .set({
        sessionData,
        updatedAt: new Date(),
      })
      .where(eq(telegramSession.id, sessionId));

    console.log(`💾 Кэш сессии ${sessionId} сохранен в БД`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`❌ Ошибка при сохранении данных сессии в БД:`, {
      sessionId,
      error: errorMessage,
      stack: errorStack,
    });

    throw error;
  }
}
