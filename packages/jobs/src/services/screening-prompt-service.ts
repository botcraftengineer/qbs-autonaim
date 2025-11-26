import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { vacancy } from "@selectio/db/schema";
import type { ScreeningPromptData } from "../types/screening";

/**
 * Генерирует промпт для скрининга резюме на основе описания вакансии
 */
export async function generateScreeningPrompt(
  vacancyId: string,
  description: string
): Promise<string> {
  console.log(`🎯 Генерация промпта для вакансии ${vacancyId}`);

  // Получаем информацию о вакансии
  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, vacancyId),
  });

  if (!vacancyData) {
    throw new Error(`Вакансия ${vacancyId} не найдена`);
  }

  // Формируем промпт для скрининга
  const prompt = buildScreeningPrompt(vacancyData.title, description);

  // Сохраняем промпт в базу данных
  await db
    .update(vacancy)
    .set({ screeningPrompt: prompt })
    .where(eq(vacancy.id, vacancyId));

  console.log(`✅ Промпт сохранен для вакансии ${vacancyId}`);

  return prompt;
}

/**
 * Формирует текст промпта для скрининга резюме
 */
function buildScreeningPrompt(title: string, description: string): string {
  return `Ты эксперт по подбору персонала. Оцени, насколько резюме кандидата подходит для вакансии:

ВАКАНСИЯ: ${title}

ОПИСАНИЕ ВАКАНСИИ:
${description}

КРИТЕРИИ ОЦЕНКИ:

1. ОПЫТ РАБОТЫ
   - Релевантность опыта
   - Продолжительность работы в схожих позициях
   - Достижения

2. НАВЫКИ
   - Соответствие технических навыков
   - Необходимые инструменты и технологии

3. ОБРАЗОВАНИЕ
   - Релевантность образования
   - Курсы и сертификаты

4. ОЦЕНКА
   - Процент соответствия (0-100%)
   - Сильные стороны
   - Слабые стороны
   - Рекомендация: invite / reject / need_info

ФОРМАТ ОТВЕТА (только JSON):
{
  "match_percentage": число от 0 до 100,
  "recommendation": "invite" | "reject" | "need_info",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1", "слабая сторона 2"],
  "summary": "краткое резюме"
}`;
}

/**
 * Получает промпт для скрининга по ID вакансии
 */
export async function getScreeningPrompt(
  vacancyId: string
): Promise<string | null> {
  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, vacancyId),
  });

  return vacancyData?.screeningPrompt ?? null;
}
