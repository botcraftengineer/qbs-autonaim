import type { Message } from "@mtcute/core";
import { and, eq, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation, gig, response, vacancy } from "@qbs-autonaim/db/schema";
import { ConversationMetadataSchema } from "@qbs-autonaim/shared/utils";

interface IdentificationResult {
  identified: boolean;
  responseId?: string;
  conversationId?: string;
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

    // 2. Search by username in response with workspaceId check
    // We need to join with entity tables (gig or vacancy) to filter by workspaceId
    if (username) {
      // Try gig responses first
      const gigResponse = await db
        .select({
          id: response.id,
          candidateName: response.candidateName,
        })
        .from(response)
        .innerJoin(
          gig,
          and(eq(response.entityType, "gig"), eq(response.entityId, gig.id)),
        )
        .where(
          and(
            eq(response.telegramUsername, username),
            eq(gig.workspaceId, workspaceId),
          ),
        )
        .orderBy(response.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      // Try vacancy responses if not found in gigs
      const vacancyResponse = gigResponse
        ? null
        : await db
            .select({
              id: response.id,
              candidateName: response.candidateName,
            })
            .from(response)
            .innerJoin(
              vacancy,
              and(
                eq(response.entityType, "vacancy"),
                eq(response.entityId, vacancy.id),
              ),
            )
            .where(
              and(
                eq(response.telegramUsername, username),
                eq(vacancy.workspaceId, workspaceId),
              ),
            )
            .orderBy(response.createdAt)
            .limit(1)
            .then((rows) => rows[0]);

      const responseByUsername = gigResponse || vacancyResponse;

      if (responseByUsername) {
        // Проверяем существующую беседу по responseId
        const existingConversation = await db.query.conversation.findFirst({
          where: eq(conversation.responseId, responseByUsername.id),
        });

        if (existingConversation) {
          return {
            identified: true,
            responseId: responseByUsername.id,
            conversationId: existingConversation.id,
            method: "username",
          };
        }

        // Создаем новую беседу
        const metadata = {
          identifiedBy: "username" as const,
          username,
        };

        // Валидируем метаданные перед вставкой
        const validationResult = ConversationMetadataSchema.safeParse(metadata);
        if (!validationResult.success) {
          console.error("Metadata validation failed:", validationResult.error);
          return { identified: false };
        }

        const [conv] = await db
          .insert(conversation)
          .values({
            responseId: responseByUsername.id,
            candidateName: responseByUsername.candidateName || undefined,
            username,
            status: "ACTIVE",
            metadata: validationResult.data,
          })
          .returning();

        return {
          identified: true,
          responseId: responseByUsername.id,
          conversationId: conv?.id,
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
      const gigResponse = await db
        .select({
          id: response.id,
          candidateName: response.candidateName,
        })
        .from(response)
        .innerJoin(
          gig,
          and(eq(response.entityType, "gig"), eq(response.entityId, gig.id)),
        )
        .where(and(eq(response.phone, phone), eq(gig.workspaceId, workspaceId)))
        .orderBy(response.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      // Try vacancy responses if not found in gigs
      const vacancyResponse = gigResponse
        ? null
        : await db
            .select({
              id: response.id,
              candidateName: response.candidateName,
            })
            .from(response)
            .innerJoin(
              vacancy,
              and(
                eq(response.entityType, "vacancy"),
                eq(response.entityId, vacancy.id),
              ),
            )
            .where(
              and(
                eq(response.phone, phone),
                eq(vacancy.workspaceId, workspaceId),
              ),
            )
            .orderBy(response.createdAt)
            .limit(1)
            .then((rows) => rows[0]);

      const responseByPhone = gigResponse || vacancyResponse;

      if (responseByPhone) {
        // Проверяем существующую беседу по responseId
        const existingConversation = await db.query.conversation.findFirst({
          where: eq(conversation.responseId, responseByPhone.id),
        });

        if (existingConversation) {
          return {
            identified: true,
            responseId: responseByPhone.id,
            conversationId: existingConversation.id,
            method: "phone",
          };
        }

        // Создаем новую беседу
        const metadata = {
          identifiedBy: "phone" as const,
          phone,
        };

        // Валидируем метаданные перед вставкой
        const validationResult = ConversationMetadataSchema.safeParse(metadata);
        if (!validationResult.success) {
          console.error("Metadata validation failed:", validationResult.error);
          return { identified: false };
        }

        const [conv] = await db
          .insert(conversation)
          .values({
            responseId: responseByPhone.id,
            candidateName: responseByPhone.candidateName || undefined,
            username,
            status: "ACTIVE",
            metadata: validationResult.data,
          })
          .returning();

        return {
          identified: true,
          responseId: responseByPhone.id,
          conversationId: conv?.id,
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
