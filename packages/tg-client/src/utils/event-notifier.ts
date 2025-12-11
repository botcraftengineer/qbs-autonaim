/**
 * Отправка событий через Inngest API
 */

import { env } from "@qbs-autonaim/config";

/**
 * Отправляет событие об ошибке авторизации в Inngest
 */
export async function sendAuthErrorEvent(
  sessionId: string,
  workspaceId: string,
  errorType: string,
  errorMessage: string,
  phone: string,
): Promise<void> {
  try {
    const eventKey = env.INNGEST_EVENT_KEY;
    const baseUrl = env.INNGEST_EVENT_API_BASE_URL;

    if (!eventKey) {
      console.warn(
        "⚠️ INNGEST_EVENT_KEY не установлен, невозможно отправить событие об ошибке авторизации",
      );
      return;
    }

    if (!baseUrl) {
      console.warn(
        "⚠️ INNGEST_EVENT_API_BASE_URL не установлен, невозможно отправить событие",
      );
      return;
    }

    const response = await fetch(`${baseUrl}/e/${eventKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "telegram/auth.error",
        data: {
          sessionId,
          workspaceId,
          errorType,
          errorMessage,
          phone,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `❌ Не удалось отправить событие об ошибке авторизации: ${response.status} ${response.statusText}`,
      );
    } else {
      console.log(
        `📧 Событие об ошибке авторизации отправлено для workspace ${workspaceId}`,
      );
    }
  } catch (error) {
    console.error("❌ Ошибка отправки события об ошибке авторизации:", error);
  }
}
