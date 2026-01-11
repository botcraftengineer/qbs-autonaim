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

  // Проверяем в универсальной таблице interview_links
  const link = await db.query.interviewLink.findFirst({
    where: (l, { eq, and }) =>
      and(eq(l.token, token), eq(l.isActive, true)),
  });

  if (!link) {
    return null;
  }

  // Проверяем срок действия
  if (link.expiresAt && link.expiresAt < new Date()) {
    return null;
  }

  // Определяем тип на основе entityType
  const type = link.entityType === "gig" ? "gig" : "vacancy";

  return {
    type,
    tokenId: link.id,
    entityId: link.entityId,
    token: link.token,
  };
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
 * Проверяет, имеет ли токен или пользователь доступ к interviewSession
 */
export async function hasInterviewAccess(
  sessionId: string,
  validatedToken: ValidatedInterviewToken | null,
  userId: string | null,
  db: typeof DbType,
): Promise<boolean> {
  // Получаем interviewSession
  const session = await db.query.interviewSession.findFirst({
    where: (interviewSession, { eq }) => eq(interviewSession.id, sessionId),
  });

  if (!session) {
    return false;
  }

  // Если есть авторизованный пользователь, проверяем владение через workspace
  if (userId) {
    // Проверяем доступ через vacancy response
    if (session.vacancyResponseId) {
      const vacancyResponse = await db.query.vacancyResponse.findFirst({
        where: (response, { eq }) =>
          eq(response.id, session.vacancyResponseId!),
        with: { vacancy: { columns: { workspaceId: true } } },
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
    if (session.gigResponseId) {
      const gigResponse = await db.query.gigResponse.findFirst({
        where: (response, { eq }) => eq(response.id, session.gigResponseId!),
        with: { gig: { columns: { workspaceId: true } } },
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
    // Для vacancy токена проверяем vacancyResponseId
    if (validatedToken.type === "vacancy" && session.vacancyResponseId) {
      const vacancyResponse = await db.query.vacancyResponse.findFirst({
        where: (response, { eq }) =>
          eq(response.id, session.vacancyResponseId!),
      });

      if (vacancyResponse?.vacancyId === validatedToken.entityId) {
        return true;
      }
    }

    // Для gig токена проверяем gigResponseId
    if (validatedToken.type === "gig" && session.gigResponseId) {
      const gigResponse = await db.query.gigResponse.findFirst({
        where: (response, { eq }) => eq(response.id, session.gigResponseId!),
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
 * Middleware helper для проверки доступа к interviewSession
 * Бросает TRPC ошибку если доступа нет
 */
export async function requireInterviewAccess(
  sessionId: string,
  validatedToken: ValidatedInterviewToken | null,
  userId: string | null,
  db: typeof DbType,
): Promise<void> {
  const hasAccess = await hasInterviewAccess(
    sessionId,
    validatedToken,
    userId,
    db,
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Нет доступа к этому интервью",
    });
  }
}
