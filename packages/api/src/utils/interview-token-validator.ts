import type { db as DbType } from "@qbs-autonaim/db/client";
import { TRPCError } from "@trpc/server";

/**
 * Результат валидации токена интервью
 */
export interface ValidatedInterviewToken {
  type: "vacancy" | "gig";
  tokenId: string;
  entityId: string; // vacancyId или gigId
  token: string;
}

/**
 * Валидирует токен интервью и возвращает информацию о нём
 * Проверяет существование, активность и срок действия
 */
export async function validateInterviewToken(
  token: string,
  db: typeof DbType,
): Promise<ValidatedInterviewToken | null> {
  if (!token || token.trim().length === 0) {
    return null;
  }

  // 1. Проверяем в таблице vacancy interview links
  const vacancyLink = await db.query.interviewLink.findFirst({
    where: (link, { eq, and }) =>
      and(eq(link.token, token), eq(link.isActive, true)),
  });

  if (vacancyLink) {
    // Проверяем срок действия
    if (vacancyLink.expiresAt && vacancyLink.expiresAt < new Date()) {
      return null;
    }

    return {
      type: "vacancy",
      tokenId: vacancyLink.id,
      entityId: vacancyLink.vacancyId,
      token: vacancyLink.token,
    };
  }

  // 2. Проверяем в таблице gig interview links
  const gigLink = await db.query.gigInterviewLink.findFirst({
    where: (link, { eq, and }) =>
      and(eq(link.token, token), eq(link.isActive, true)),
  });

  if (gigLink) {
    // Проверяем срок действия
    if (gigLink.expiresAt && gigLink.expiresAt < new Date()) {
      return null;
    }

    return {
      type: "gig",
      tokenId: gigLink.id,
      entityId: gigLink.gigId,
      token: gigLink.token,
    };
  }

  return null;
}

/**
 * Проверяет, имеет ли токен доступ к указанной вакансии
 */
export function hasVacancyAccess(
  validatedToken: ValidatedInterviewToken | null,
  vacancyId: string,
): boolean {
  return (
    validatedToken !== null &&
    validatedToken.type === "vacancy" &&
    validatedToken.entityId === vacancyId
  );
}

/**
 * Проверяет, имеет ли токен доступ к указанному гигу
 */
export function hasGigAccess(
  validatedToken: ValidatedInterviewToken | null,
  gigId: string,
): boolean {
  return (
    validatedToken !== null &&
    validatedToken.type === "gig" &&
    validatedToken.entityId === gigId
  );
}

/**
 * Проверяет, имеет ли токен или пользователь доступ к conversation
 */
export async function hasConversationAccess(
  conversationId: string,
  validatedToken: ValidatedInterviewToken | null,
  userId: string | null,
  db: typeof DbType,
): Promise<boolean> {
  // Получаем conversation с необходимыми связями
  const conv = await db.query.conversation.findFirst({
    where: (conversation, { eq }) => eq(conversation.id, conversationId),
  });

  if (!conv) {
    return false;
  }

  // Если есть авторизованный пользователь, проверяем владение через workspace
  if (userId) {
    // Проверяем доступ через vacancy response
    const responseId = conv.responseId;
    if (responseId) {
      const vacancyResponse = await db.query.vacancyResponse.findFirst({
        where: (response, { eq }) => eq(response.id, responseId),
        with: {
          vacancy: true,
        },
      });

      if (vacancyResponse?.vacancy) {
        const workspaceMember = await db.query.workspaceMember.findFirst({
          where: (member, { eq, and }) =>
            and(
              eq(member.workspaceId, vacancyResponse.vacancy.workspaceId),
              eq(member.userId, userId),
            ),
        });
        if (workspaceMember) {
          return true;
        }
      }
    }

    // Проверяем доступ через gig response
    const gigResponseId = conv.gigResponseId;
    if (gigResponseId) {
      const gigResponse = await db.query.gigResponse.findFirst({
        where: (response, { eq }) => eq(response.id, gigResponseId),
        with: {
          gig: true,
        },
      });

      if (gigResponse?.gig) {
        const workspaceMember = await db.query.workspaceMember.findFirst({
          where: (member, { eq, and }) =>
            and(
              eq(member.workspaceId, gigResponse.gig.workspaceId),
              eq(member.userId, userId),
            ),
        });
        if (workspaceMember) {
          return true;
        }
      }
    }
  }

  // Если есть валидированный токен, проверяем соответствие
  if (validatedToken) {
    // Для vacancy токена проверяем responseId
    const responseId = conv.responseId;
    if (validatedToken.type === "vacancy" && responseId) {
      const vacancyResponse = await db.query.vacancyResponse.findFirst({
        where: (response, { eq }) => eq(response.id, responseId),
      });

      if (vacancyResponse?.vacancyId === validatedToken.entityId) {
        return true;
      }
    }

    // Для gig токена проверяем gigResponseId
    const gigResponseId = conv.gigResponseId;
    if (validatedToken.type === "gig" && gigResponseId) {
      const gigResponse = await db.query.gigResponse.findFirst({
        where: (response, { eq }) => eq(response.id, gigResponseId),
      });

      if (gigResponse?.gigId === validatedToken.entityId) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Извлекает токен из заголовков запроса
 * Поддерживает Authorization: Bearer <token> и x-interview-token: <token>
 */
export function extractTokenFromHeaders(headers: Headers): string | null {
  // Проверяем Authorization header
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Проверяем кастомный header
  const customHeader = headers.get("x-interview-token");
  if (customHeader) {
    return customHeader;
  }

  return null;
}

/**
 * Middleware helper для проверки доступа к conversation
 * Бросает TRPC ошибку если доступа нет
 */
export async function requireConversationAccess(
  conversationId: string,
  validatedToken: ValidatedInterviewToken | null,
  userId: string | null,
  db: typeof DbType,
): Promise<void> {
  const hasAccess = await hasConversationAccess(
    conversationId,
    validatedToken,
    userId,
    db,
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Нет доступа к этому разговору",
    });
  }
}
