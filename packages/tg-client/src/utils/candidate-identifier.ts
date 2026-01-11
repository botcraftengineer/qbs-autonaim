import type { Message } from "@mtcute/core";
import { and, eq, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  gig,
  interviewSession,
  response,
  vacancy,
} from "@qbs-autonaim/db/schema";

interface IdentificationResult {
  identified: boolean;
  responseId?: string;
  interviewSessionId?: string;
  method?: "username" | "phone" | "pinCode";
}

/**
 * Идентифицировать кандидата по различным параметрам
 * Теперь используем username как основной идентификатор для Telegram
 */
export async function identifyCandidate(
  message: Message,
  workspaceId: string,
): Promise<IdentificationResult> {
  try {
    // 1. Получение username отправителя
    const sender = message.sender;
    let username: string | undefined;

    if (sender && "username" in sender && sender.username) {
      username = sender.username;
    }

    // 2. Search by username in responses
    if (username) {
      const responseByUsername = await db
        .select({
          id: response.id,
          candidateName: response.candidateName,
          entityType: response.entityType,
        })
        .from(response)
        .leftJoin(
          gig,
          and(eq(response.entityType, "gig"), eq(response.entityId, gig.id)),
        )
        .leftJoin(
          vacancy,
          and(
            eq(response.entityType, "vacancy"),
            eq(response.entityId, vacancy.id),
          ),
        )
        .where(
          and(
            eq(response.telegramUsername, username),
            or(
              eq(gig.workspaceId, workspaceId),
              eq(vacancy.workspaceId, workspaceId),
            ),
          ),
        )
        .orderBy(response.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      if (responseByUsername) {
        // Проверяем существующую сессию интервью
        const existingSession = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.responseId, responseByUsername.id),
        });

        if (existingSession) {
          return {
            identified: true,
            responseId: responseByUsername.id,
            interviewSessionId: existingSession.id,
            method: "username",
          };
        }

        // Создаем новую сессию интервью
        const metadata = {
          identifiedBy: "username" as const,
          username,
          candidateName: responseByUsername.candidateName,
        };

        const [session] = await db
          .insert(interviewSession)
          .values({
            responseId: responseByUsername.id,
            status: "active",
            lastChannel: "telegram",
            metadata,
          })
          .returning();

        return {
          identified: true,
          responseId: responseByUsername.id,
          interviewSessionId: session?.id,
          method: "username",
        };
      }
    }

    // 3. Search by phone number (if available)
    const phone =
      sender && "phone" in sender && typeof sender.phone === "string"
        ? sender.phone
        : undefined;

    if (phone) {
      const responseByPhone = await db
        .select({
          id: response.id,
          candidateName: response.candidateName,
          entityType: response.entityType,
        })
        .from(response)
        .leftJoin(
          gig,
          and(eq(response.entityType, "gig"), eq(response.entityId, gig.id)),
        )
        .leftJoin(
          vacancy,
          and(
            eq(response.entityType, "vacancy"),
            eq(response.entityId, vacancy.id),
          ),
        )
        .where(
          and(
            eq(response.phone, phone),
            or(
              eq(gig.workspaceId, workspaceId),
              eq(vacancy.workspaceId, workspaceId),
            ),
          ),
        )
        .orderBy(response.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      if (responseByPhone) {
        // Проверяем существующую сессию
        const existingSession = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.responseId, responseByPhone.id),
        });

        if (existingSession) {
          return {
            identified: true,
            responseId: responseByPhone.id,
            interviewSessionId: existingSession.id,
            method: "phone",
          };
        }

        // Создаем новую сессию интервью
        const metadata = {
          identifiedBy: "phone" as const,
          phone,
          candidateName: responseByPhone.candidateName,
        };

        const [session] = await db
          .insert(interviewSession)
          .values({
            responseId: responseByPhone.id,
            status: "active",
            lastChannel: "telegram",
            metadata,
          })
          .returning();

        return {
          identified: true,
          responseId: responseByPhone.id,
          interviewSessionId: session?.id,
          method: "phone",
        };
      }
    }

    // Кандидат не идентифицирован
    return { identified: false };
  } catch (error) {
    console.error("Ошибка идентификации кандидата:", error);
    return { identified: false };
  }
}
