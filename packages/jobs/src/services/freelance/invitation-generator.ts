import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  freelanceInvitation,
  interviewLink,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { generateText } from "@qbs-autonaim/lib/ai";
import { createLogger, err, ok, type Result, tryCatch } from "../base";

const logger = createLogger("InvitationGenerator");

// Минимальный порог оценки для отправки приглашения (из 100)
const MIN_SCORE_THRESHOLD = 60;

interface InvitationResult {
  invitationId: string;
  invitationText: string;
  interviewUrl: string;
  score: number;
}

/**
 * Generates personalized invitation text using AI
 */
async function generateInvitationText(
  candidateName: string | null,
  vacancyTitle: string,
  interviewUrl: string,
  score: number,
): Promise<string> {
  const prompt = `Ты - HR-менеджер. Создай персонализированное приглашение на AI-интервью для фрилансера.

ИНФОРМАЦИЯ:
- Имя кандидата: ${candidateName || "Уважаемый кандидат"}
- Вакансия: ${vacancyTitle}
- Оценка отклика: ${score}/100
- Ссылка на интервью: ${interviewUrl}

ТРЕБОВАНИЯ:
1. Обращайся к кандидату по имени (если известно)
2. Упомяни, что его отклик заинтересовал
3. Объясни, что интервью проводится через AI-чат
4. Укажи примерное время прохождения (10-15 минут)
5. Добавь ссылку на интервью
6. Используй дружелюбный, но профессиональный тон
7. Текст должен быть на русском языке
8. Не используй markdown форматирование

Создай текст приглашения (только текст, без дополнительных комментариев):`;

  const { text } = await generateText({
    prompt,
    generationName: "generate-freelance-invitation",
    metadata: {
      candidateName: candidateName || "unknown",
      vacancyTitle,
      score,
    },
  });

  return text.trim();
}

/**
 * Generates invitation for qualified freelancer
 */
export async function generateFreelanceInvitation(
  responseId: string,
): Promise<Result<InvitationResult | null>> {
  logger.info(`Generating invitation for response ${responseId}`);

  // Получаем отклик с оценкой
  const responseResult = await tryCatch(async () => {
    return await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
      with: {
        screening: true,
      },
    });
  }, "Failed to fetch response");

  if (!responseResult.success) {
    return err(responseResult.error);
  }

  const response = responseResult.data;
  if (!response) {
    return err(`Response ${responseId} not found`);
  }

  // Проверяем, что это фриланс-отклик
  if (
    response.importSource !== "FREELANCE_MANUAL" &&
    response.importSource !== "FREELANCE_LINK"
  ) {
    logger.info(
      `Skipping invitation: not a freelance response (source: ${response.importSource})`,
    );
    return ok(null);
  }

  // Проверяем наличие скрининга
  if (!response.screening) {
    return err(`Screening not found for response ${responseId}`);
  }

  // Проверяем порог оценки
  if (response.screening.detailedScore < MIN_SCORE_THRESHOLD) {
    logger.info(
      `Skipping invitation: score ${response.screening.detailedScore} below threshold ${MIN_SCORE_THRESHOLD}`,
    );
    return ok(null);
  }

  // Проверяем, не было ли уже отправлено приглашение
  const existingInvitation = await db.query.freelanceInvitation.findFirst({
    where: eq(freelanceInvitation.responseId, responseId),
  });

  if (existingInvitation) {
    logger.info(`Invitation already exists for response ${responseId}`);
    return ok({
      invitationId: existingInvitation.id,
      invitationText: existingInvitation.invitationText,
      interviewUrl: existingInvitation.interviewUrl,
      score: response.screening.detailedScore,
    });
  }

  // Получаем вакансию
  const vacancyResult = await tryCatch(async () => {
    return await db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.vacancyId),
    });
  }, "Failed to fetch vacancy");

  if (!vacancyResult.success) {
    return err(vacancyResult.error);
  }

  const vacancyData = vacancyResult.data;
  if (!vacancyData) {
    return err(`Vacancy ${response.vacancyId} not found`);
  }

  // Получаем ссылку на интервью
  const interviewLinkResult = await tryCatch(async () => {
    return await db.query.interviewLink.findFirst({
      where: eq(interviewLink.vacancyId, response.vacancyId),
    });
  }, "Failed to fetch interview link");

  if (!interviewLinkResult.success) {
    return err(interviewLinkResult.error);
  }

  const link = interviewLinkResult.data;
  if (!link) {
    return err(`Interview link not found for vacancy ${response.vacancyId}`);
  }

  const interviewUrl = `${env.NEXT_PUBLIC_INTERVIEW_URL || "https://interview.domain.ru"}/${link.token}`;

  // Генерируем текст приглашения
  logger.info("Generating invitation text with AI");

  const screeningScore = response.screening?.detailedScore;
  if (!screeningScore) {
    return err("Screening score not found");
  }

  const textResult = await tryCatch(
    async () =>
      await generateInvitationText(
        response.candidateName,
        vacancyData.title,
        interviewUrl,
        screeningScore,
      ),
    "Failed to generate invitation text",
  );

  if (!textResult.success) {
    return err(textResult.error);
  }

  // Сохраняем приглашение
  const saveResult = await tryCatch(async () => {
    const [invitation] = await db
      .insert(freelanceInvitation)
      .values({
        responseId,
        invitationText: textResult.data,
        interviewUrl,
      })
      .returning();

    if (!invitation) {
      throw new Error("Failed to create invitation");
    }

    logger.info(`Invitation saved with ID ${invitation.id}`);

    return {
      invitationId: invitation.id,
      invitationText: invitation.invitationText,
      interviewUrl: invitation.interviewUrl,
      score: response.screening?.detailedScore ?? 0,
    };
  }, "Failed to save invitation");

  return saveResult;
}
