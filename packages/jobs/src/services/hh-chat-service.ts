import { randomUUID } from "node:crypto";
import { db, eq } from "@selectio/db";
import { integration } from "@selectio/db/schema";
import axios from "axios";
import { HH_CONFIG } from "../parsers/hh/config";

/**
 * Отправляет сообщение в чат hh.ru
 */
export async function sendHHChatMessage(params: {
  workspaceId: string;
  responseId: string;
  text: string;
}): Promise<{ success: boolean; error?: string }> {
  const { workspaceId, responseId, text } = params;

  try {
    // Получаем отклик с chat_id
    const response = await db.query.vacancyResponse.findFirst({
      where: (fields) => eq(fields.id, responseId),
    });

    if (!response) {
      return {
        success: false,
        error: "Отклик не найден",
      };
    }

    if (!response.chatId) {
      return {
        success: false,
        error: "chat_id не найден для этого отклика",
      };
    }

    // Получаем интеграцию hh.ru для workspace
    const hhIntegration = await db.query.integration.findFirst({
      where: (fields, { and }) =>
        and(
          eq(fields.workspaceId, workspaceId),
          eq(fields.type, "hh"),
          eq(fields.isActive, "true"),
        ),
    });

    if (!hhIntegration) {
      return {
        success: false,
        error: "Интеграция hh.ru не найдена или неактивна",
      };
    }

    if (!hhIntegration.cookies || hhIntegration.cookies.length === 0) {
      return {
        success: false,
        error: "Cookies для hh.ru не найдены",
      };
    }

    // Формируем Cookie header
    const cookieHeader = hhIntegration.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    // Извлекаем XSRF token из cookies
    const xsrfCookie = hhIntegration.cookies.find(
      (cookie) =>
        cookie.name === "XSRF-TOKEN" ||
        cookie.name === "_xsrf" ||
        cookie.name === "xsrf_token",
    );

    const xsrfToken = xsrfCookie?.value;

    if (!xsrfToken) {
      console.warn("⚠️ XSRF token не найден в cookies");
    }

    const idempotencyKey = randomUUID();

    console.log(`📤 Отправка сообщения в HH чат`, {
      chatId: response.chatId,
      chatIdNumber: Number(response.chatId),
      responseId,
      textLength: text.length,
      hasXsrfToken: !!xsrfToken,
    });

    // Отправляем запрос в hh.ru API с полными браузерными заголовками
    const apiResponse = await axios.post(
      "https://chatik.hh.ru/chatik/api/send?hhtmSourceLabel=spoiler&hhtmSource=chat",
      {
        chatId: Number(response.chatId),
        idempotencyKey,
        text,
      },
      {
        headers: {
          "User-Agent": HH_CONFIG.userAgent,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "Content-Type": "application/json",
          Origin: "https://hh.ru",
          Referer: "https://hh.ru/",
          Cookie: cookieHeader,
          ...(xsrfToken && { "x-xsrftoken": xsrfToken }),
          "Sec-Ch-Ua":
            '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
        },
        validateStatus: (status: number) => status < 500,
      },
    );

    if (apiResponse.status !== 200) {
      console.error("❌ Ошибка отправки в hh.ru:", {
        status: apiResponse.status,
        data: apiResponse.data,
        chatId: response.chatId,
        responseId,
      });
      return {
        success: false,
        error: `HTTP ${apiResponse.status}: ${JSON.stringify(apiResponse.data)}`,
      };
    }

    // Обновляем lastUsedAt для интеграции
    await db
      .update(integration)
      .set({ lastUsedAt: new Date() })
      .where(eq(integration.id, hhIntegration.id));

    console.log(`✅ Сообщение отправлено в hh.ru чат ${response.chatId}`);

    return { success: true };
  } catch (error) {
    console.error("Ошибка отправки сообщения в hh.ru:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
