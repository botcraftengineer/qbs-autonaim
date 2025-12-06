import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { vacancy } from "@selectio/db/schema";
import { buildVacancyRequirementsExtractionPrompt } from "@selectio/prompts";
import { generateText } from "../../lib/ai-client";
import { vacancyRequirementsSchema } from "../../schemas/vacancy-requirements.schema";
import type { VacancyRequirements } from "../../types/screening";
import { extractJsonFromText } from "../../utils/json-extractor";
import { AI, createLogger, err, type Result, tryCatch } from "../base";

const logger = createLogger("VacancyRequirements");

/**
 * Parses AI response into structured requirements
 */
function parseRequirements(response: string): VacancyRequirements {
  const extracted = extractJsonFromText(response);

  if (!extracted) {
    throw new Error("JSON не найден в ответе ИИ");
  }

  const validated = vacancyRequirementsSchema.parse(extracted);
  return validated as VacancyRequirements;
}

/**
 * Extracts and structures vacancy requirements via AI
 */
export async function extractVacancyRequirements(
  vacancyId: string,
  description: string,
): Promise<Result<VacancyRequirements>> {
  logger.info(`Generating requirements for vacancy ${vacancyId}`);

  const vacancyResult = await tryCatch(async () => {
    return await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
  }, "Failed to fetch vacancy");

  if (!vacancyResult.success) {
    return err(vacancyResult.error);
  }

  const vacancyData = vacancyResult.data;
  if (!vacancyData) {
    return err(`Вакансия ${vacancyId} не найдена`);
  }

  const prompt = buildVacancyRequirementsExtractionPrompt(
    vacancyData.title,
    description,
  );

  logger.info("Sending request to AI for requirements extraction");

  const aiResult = await tryCatch(async () => {
    const { text } = await generateText({
      prompt,
      temperature: AI.TEMPERATURE_LOW,
      generationName: "extract-vacancy-requirements",
      entityId: vacancyId,
      metadata: {
        vacancyId,
        title: vacancyData.title,
      },
    });
    return text;
  }, "AI request failed");

  if (!aiResult.success) {
    return err(aiResult.error);
  }

  logger.info("Received AI response");

  const parseResult = await tryCatch(async () => {
    const requirements = parseRequirements(aiResult.data);

    await db
      .update(vacancy)
      .set({ requirements })
      .where(eq(vacancy.id, vacancyId));

    logger.info(`Requirements saved for vacancy ${vacancyId}`);
    return requirements;
  }, "Failed to parse requirements");

  return parseResult;
}

/**
 * Gets vacancy requirements from database
 */
export async function getVacancyRequirements(
  vacancyId: string,
): Promise<VacancyRequirements | null> {
  const result = await tryCatch(async () => {
    const vacancyData = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });

    return (vacancyData?.requirements as VacancyRequirements) ?? null;
  }, "Failed to get vacancy requirements");

  if (!result.success) {
    logger.error(result.error);
    return null;
  }

  return result.data;
}
