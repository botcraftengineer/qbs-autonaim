import type { Message } from "@mtcute/core";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  chatSession,
  gig,
  gigResponse,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { ConversationMetadataSchema } from "@qbs-autonaim/shared/utils";

interface IdentificationResult {
  identified: boolean;
  responseId?: string;
  chatSessionId?: string;
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

    // 2. Search by username in gig responses
    if (username) {
      // Try gig responses first
      const gigResp = await db
        .select({
          id: gigResponse.id,
          candidateName: gigResponse.candidateName,
        })
        .from(gigResponse)
        .innerJoin(gig, eq(gigResponse.gigId, gig.id))
        .where(
          and(
            eq(gigResponse.telegramUsername, username),
            eq(gig.workspaceId, workspaceId),
          ),
        )
        .orderBy(gigResponse.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      // Try vacancy responses if not found in gigs
      const vacancyResp = gigResp
        ? null
        : await db
            .select({
              id: vacancyResponse.id,
              candidateName: vacancyResponse.candidateName,
            })
            .from(vacancyResponse)
            .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
            .where(
              and(
                eq(vacancyResponse.telegramUsername, username),
                eq(vacancy.workspaceId, workspaceId),
              ),
            )
            .orderBy(vacancyResponse.createdAt)
            .limit(1)
            .then((rows) => rows[0]);

      const responseByUsername = gigResp || vacancyResp;
      const entityType = gigResp ? "gig_response" : "vacancy_response";

      if (responseByUsername) {
        // Проверяем существующую сессию по entityId
        const existingSession = await db.query.chatSession.findFirst({
          where: and(
            eq(chatSession.entityType, entityType),
            eq(chatSession.entityId, responseByUsername.id),
          ),
        });

        if (existingSession) {
          return {
            identified: true,
            responseId: responseByUsername.id,
            chatSessionId: existingSession.id,
            method: "username",
          };
        }

        // Создаем новую сессию
        const metadata = {
          identifiedBy: "username" as const,
          username,
          candidateName: responseByUsername.candidateName,
        };

        // Валидируем метаданные перед вставкой
        const validationResult = ConversationMetadataSchema.safeParse(metadata);
        if (!validationResult.success) {
          console.error("Metadata validation failed:", validationResult.error);
          return { identified: false };
        }

        const [session] = await db
          .insert(chatSession)
          .values({
            entityType,
            entityId: responseByUsername.id,
            title: responseByUsername.candidateName || undefined,
            status: "active",
            metadata: validationResult.data,
          })
          .returning();

        return {
          identified: true,
          responseId: responseByUsername.id,
          chatSessionId: session?.id,
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
      // Try gig responses first
      const gigResp = await db
        .select({
          id: gigResponse.id,
          candidateName: gigResponse.candidateName,
        })
        .from(gigResponse)
        .innerJoin(gig, eq(gigResponse.gigId, gig.id))
        .where(
          and(eq(gigResponse.phone, phone), eq(gig.workspaceId, workspaceId)),
        )
        .orderBy(gigResponse.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      // Try vacancy responses if not found in gigs
      const vacancyResp = gigResp
        ? null
        : await db
            .select({
              id: vacancyResponse.id,
              candidateName: vacancyResponse.candidateName,
            })
            .from(vacancyResponse)
            .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
            .where(
              and(
                eq(vacancyResponse.phone, phone),
                eq(vacancy.workspaceId, workspaceId),
              ),
            )
            .orderBy(vacancyResponse.createdAt)
            .limit(1)
            .then((rows) => rows[0]);

      const responseByPhone = gigResp || vacancyResp;
      const entityType = gigResp ? "gig_response" : "vacancy_response";

      if (responseByPhone) {
        // Проверяем существующую сессию
        const existingSession = await db.query.chatSession.findFirst({
          where: and(
            eq(chatSession.entityType, entityType),
            eq(chatSession.entityId, responseByPhone.id),
          ),
        });

        if (existingSession) {
          return {
            identified: true,
            responseId: responseByPhone.id,
            chatSessionId: existingSession.id,
            method: "phone",
          };
        }

        // Создаем новую сессию
        const metadata = {
          identifiedBy: "phone" as const,
          phone,
          candidateName: responseByPhone.candidateName,
        };

        // Валидируем метаданные перед вставкой
        const validationResult = ConversationMetadataSchema.safeParse(metadata);
        if (!validationResult.success) {
          console.error("Metadata validation failed:", validationResult.error);
          return { identified: false };
        }

        const [session] = await db
          .insert(chatSession)
          .values({
            entityType,
            entityId: responseByPhone.id,
            title: responseByPhone.candidateName || undefined,
            status: "active",
            metadata: validationResult.data,
          })
          .returning();

        return {
          identified: true,
          responseId: responseByPhone.id,
          chatSessionId: session?.id,
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
