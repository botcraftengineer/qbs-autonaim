import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  responseScreening,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { generateText } from "@qbs-autonaim/lib/ai";
import { buildResponseScreeningPrompt } from "@qbs-autonaim/prompts";
import { stripHtml } from "string-strip-html";
import { responseScreeningResultSchema } from "../../schemas/response-screening.schema";
import { extractJsonFromText } from "../../utils/json-extractor";
import {
  createLogger,
  err,
  RESPONSE_STATUS,
  type Result,
  tryCatch,
} from "../base";
import { getVacancyRequirements } from "../vacancy";

const logger = createLogger("ResponseScreening");

interface ScreeningResult {
  score: number;
  detailedScore: number;
  analysis: string;
  resumeLanguage: string;
}

/**
 * Parses AI screening result
 */
function parseScreeningResult(text: string): ScreeningResult {
  const extracted = extractJsonFromText(text);

  if (!extracted) {
    throw new Error("JSON не найден в ответе ИИ");
  }

  return responseScreeningResultSchema.parse(extracted);
}

/**
 * Screens response and generates evaluation
 */
export async function screenResponse(
  responseId: string,
): Promise<Result<ScreeningResult>> {
  logger.info(`Screening response ${responseId}`);

  const responseResult = await tryCatch(async () => {
    return await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
    });
  }, "Failed to fetch response");

  if (!responseResult.success) {
    return err(responseResult.error);
  }

  const response = responseResult.data;
  if (!response) {
    return err(`Response ${responseId} not found`);
  }

  const requirements = await getVacancyRequirements(response.vacancyId);

  if (!requirements) {
    return err(`Requirements for vacancy ${response.vacancyId} not found`);
  }

  // Получаем кастомный промпт из вакансии
  const vacancyResult = await tryCatch(async () => {
    return await db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.vacancyId),
      columns: {
        customScreeningPrompt: true,
      },
    });
  }, "Failed to fetch vacancy settings");

  const customPrompt = vacancyResult.success
    ? vacancyResult.data?.customScreeningPrompt
    : null;

  const prompt = buildResponseScreeningPrompt(
    {
      candidateName: response.candidateName,
      experience: response.experience
        ? stripHtml(response.experience).result
        : response.experience,
      coverLetter: response.coverLetter,
    },
    requirements,
    customPrompt,
  );

  logger.info("Sending request to AI for screening");

  const aiResult = await tryCatch(async () => {
    const { text } = await generateText({
      prompt,
      generationName: "screen-response",
      entityId: responseId,
      metadata: {
        responseId,
        vacancyId: response.vacancyId,
      },
    });
    return text;
  }, "AI request failed");

  if (!aiResult.success) {
    return err(aiResult.error);
  }

  logger.info("Received AI response");

  const saveResult = await tryCatch(async () => {
    const result = parseScreeningResult(aiResult.data);

    // Check if screening record exists
    const existingScreening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    if (existingScreening) {
      await db
        .update(responseScreening)
        .set({
          score: result.score,
          detailedScore: result.detailedScore,
          analysis: result.analysis,
        })
        .where(eq(responseScreening.responseId, responseId));
    } else {
      await db.insert(responseScreening).values({
        responseId,
        score: result.score,
        detailedScore: result.detailedScore,
        analysis: result.analysis,
      });
    }

    // Обновляем статус и язык резюме
    await db
      .update(vacancyResponse)
      .set({ 
        status: RESPONSE_STATUS.EVALUATED,
        resumeLanguage: result.resumeLanguage,
      })
      .where(eq(vacancyResponse.id, responseId));

    logger.info(
      `Screening result saved: score ${result.score}/5 (${result.detailedScore}/100), language: ${result.resumeLanguage}`,
    );

    return result;
  }, "Failed to save screening result");

  return saveResult;
}
