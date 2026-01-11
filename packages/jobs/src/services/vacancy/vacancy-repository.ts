import { eq, isNull, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { PlatformSource } from "@qbs-autonaim/db/schema";
import { vacancy } from "@qbs-autonaim/db/schema";
import type { VacancyData } from "../../parsers/types";
import { createLogger, type Result, tryCatch } from "../base";
import { triggerVacancyRequirementsExtraction } from "../triggers";

const logger = createLogger("VacancyRepository");

/**
 * Данные вакансии для сохранения в БД
 */
interface VacancyDbData {
  id: string;
  workspaceId: string;
  title: string;
  url?: string;
  source: PlatformSource;
  externalId?: string;
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
 * Преобразует данные вакансии из парсера в формат БД
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
    source: vacancyData.source as PlatformSource,
    externalId: vacancyData.externalId,
    views: Number.parseInt(vacancyData.views, 10) || 0,
    responses: Number.parseInt(vacancyData.responses, 10) || 0,
    newResponses: Number.parseInt(vacancyData.newResponses, 10) || 0,
    resumesInProgress: Number.parseInt(vacancyData.resumesInProgress, 10) || 0,
    suitableResumes: Number.parseInt(vacancyData.suitableResumes, 10) || 0,
    region: vacancyData.region || "",
    description: description ?? vacancyData.description ?? "",
    isActive: true,
  };
}

/**
 * Проверяет существование вакансии в БД
 */
export async function checkVacancyExists(
  vacancyId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
    return !!existingVacancy;
  }, "Ошибка проверки существования вакансии");
}

/**
 * Проверяет наличие описания у вакансии
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
  }, "Ошибка проверки описания вакансии");
}

/**
 * Получает вакансию по ID
 */
export async function getVacancyById(vacancyId: string) {
  return tryCatch(async () => {
    const result = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
    return result ?? null;
  }, "Ошибка получения вакансии");
}

/**
 * Получает все вакансии без описания
 */
export async function getVacanciesWithoutDescription() {
  return tryCatch(async () => {
    return await db.query.vacancy.findMany({
      where: or(isNull(vacancy.description), eq(vacancy.description, "")),
    });
  }, "Ошибка получения вакансий без описания");
}

/**
 * Сохраняет базовую информацию о вакансии (без описания)
 * Возвращает true если вакансия была создана впервые
 */
export async function saveBasicVacancy(
  vacancyData: VacancyData,
  workspaceId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    // Проверяем существование вакансии
    const existingVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyData.id),
    });

    const isNew = !existingVacancy;
    const dataToSave = mapVacancyData(vacancyData, workspaceId, "");

    await db.insert(vacancy).values(dataToSave).onConflictDoUpdate({
      target: vacancy.id,
      set: dataToSave,
    });

    logger.info(
      `Базовая информация ${isNew ? "создана" : "обновлена"}: ${vacancyData.title}`,
    );

    return isNew;
  }, `Ошибка сохранения базовой информации вакансии ${vacancyData.title}`);
}

/**
 * Обновляет описание вакансии и запускает извлечение требований
 */
export async function updateVacancyDescription(
  vacancyId: string,
  description: string,
  isNewVacancy = false,
): Promise<Result<void>> {
  return tryCatch(async () => {
    await db
      .update(vacancy)
      .set({ description })
      .where(eq(vacancy.id, vacancyId));

    logger.info(
      `Описание ${isNewVacancy ? "добавлено для новой вакансии" : "обновлено"}: ${vacancyId}`,
    );

    // Запускаем извлечение требований если описание не пустое
    if (description?.trim()) {
      logger.info(
        `Запуск извлечения требований для ${isNewVacancy ? "новой" : "существующей"} вакансии: ${vacancyId}`,
      );
      await triggerVacancyRequirementsExtraction(
        {
          vacancyId,
          description,
        },
        { swallow: true },
      );
    }
  }, `Ошибка обновления описания вакансии ${vacancyId}`);
}

/**
 * Сохраняет или обновляет полные данные вакансии
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

    logger.info(`Вакансия сохранена/обновлена: ${vacancyData.title}`);

    // Запускаем извлечение требований если описание не пустое
    if (vacancyData.description?.trim()) {
      logger.info(`Запуск извлечения требований: ${vacancyData.id}`);
      await triggerVacancyRequirementsExtraction(
        {
          vacancyId: vacancyData.id,
          description: vacancyData.description,
        },
        { swallow: true },
      );
    }
  }, `Ошибка сохранения вакансии ${vacancyData.id}`);
}
