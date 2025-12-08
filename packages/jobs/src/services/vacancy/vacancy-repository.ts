import { eq, isNull, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import type { VacancyData } from "../../parsers/types";
import { createLogger, type Result, tryCatch } from "../base";
import { triggerVacancyRequirementsExtraction } from "../triggers";

const logger = createLogger("VacancyRepository");

/**
 * Database-ready vacancy data
 */
interface VacancyDbData {
  id: string;
  workspaceId: string;
  title: string;
  url?: string;
  views: number;
  responses: number;
  newResponses: number;
  resumesInProgress: number;
  suitableResumes: number;
  region: string;
  description: string;
  isActive: boolean;
}

/**
 * Transforms parser vacancy data to database format
 */
function mapVacancyData(
  vacancyData: VacancyData,
  workspaceId: string,
  description?: string,
): VacancyDbData {
  return {
    id: vacancyData.id,
    workspaceId,
    title: vacancyData.title,
    url: vacancyData.url || undefined,
    views: Number.parseInt(vacancyData.views, 10) || 0,
    responses: Number.parseInt(vacancyData.responses, 10) || 0,
    newResponses: Number.parseInt(vacancyData.newResponses, 10) || 0,
    resumesInProgress: Number.parseInt(vacancyData.resumesInProgress, 10) || 0,
    suitableResumes: Number.parseInt(vacancyData.suitableResumes, 10) || 0,
    region: vacancyData.region,
    description: description ?? vacancyData.description ?? "",
    isActive: true,
  };
}

/**
 * Checks if vacancy exists in database
 */
export async function checkVacancyExists(
  vacancyId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
    return !!existingVacancy;
  }, "Failed to check vacancy existence");
}

/**
 * Checks if vacancy has description
 */
export async function hasVacancyDescription(
  vacancyId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });

    if (!existingVacancy) return false;
    return !!existingVacancy.description?.trim();
  }, "Failed to check vacancy description");
}

/**
 * Gets vacancy by ID
 */
export async function getVacancyById(vacancyId: string) {
  return tryCatch(async () => {
    const result = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
    return result ?? null;
  }, "Failed to get vacancy");
}

/**
 * Gets all vacancies without description
 */
export async function getVacanciesWithoutDescription() {
  return tryCatch(async () => {
    return await db.query.vacancy.findMany({
      where: or(isNull(vacancy.description), eq(vacancy.description, "")),
    });
  }, "Failed to get vacancies without description");
}

/**
 * Saves basic vacancy info (without description)
 */
export async function saveBasicVacancy(
  vacancyData: VacancyData,
  workspaceId: string,
): Promise<Result<void>> {
  return tryCatch(async () => {
    const dataToSave = mapVacancyData(vacancyData, workspaceId, "");

    await db.insert(vacancy).values(dataToSave).onConflictDoUpdate({
      target: vacancy.id,
      set: dataToSave,
    });

    logger.info(`Basic info saved/updated: ${vacancyData.title}`);
  }, `Failed to save basic vacancy ${vacancyData.title}`);
}

/**
 * Updates vacancy description and triggers requirements extraction
 */
export async function updateVacancyDescription(
  vacancyId: string,
  description: string,
): Promise<Result<void>> {
  return tryCatch(async () => {
    await db
      .update(vacancy)
      .set({ description })
      .where(eq(vacancy.id, vacancyId));

    logger.info(`Description updated: ${vacancyId}`);

    // Trigger requirements extraction if description is not empty
    if (description?.trim()) {
      logger.info(`Triggering requirements extraction: ${vacancyId}`);
      await triggerVacancyRequirementsExtraction(
        {
          vacancyId,
          description,
        },
        { swallow: true },
      );
    }
  }, `Failed to update vacancy description ${vacancyId}`);
}

/**
 * Saves or updates full vacancy data
 */
export async function saveVacancyToDb(
  vacancyData: VacancyData,
  workspaceId: string,
): Promise<Result<void>> {
  return tryCatch(async () => {
    const dataToSave = mapVacancyData(vacancyData, workspaceId);

    await db.insert(vacancy).values(dataToSave).onConflictDoUpdate({
      target: vacancy.id,
      set: dataToSave,
    });

    logger.info(`Vacancy saved/updated: ${vacancyData.title}`);

    // Trigger requirements extraction if description is not empty
    if (vacancyData.description?.trim()) {
      logger.info(`Triggering requirements extraction: ${vacancyData.id}`);
      await triggerVacancyRequirementsExtraction(
        {
          vacancyId: vacancyData.id,
          description: vacancyData.description,
        },
        { swallow: true },
      );
    }
  }, `Failed to save vacancy ${vacancyData.id}`);
}
