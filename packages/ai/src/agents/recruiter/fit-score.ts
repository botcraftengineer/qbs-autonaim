/**
 * Fit Score Calculation - Расчёт оценки соответствия кандидата вакансии
 *
 * fitScore - это комплексная оценка от 0 до 100, которая учитывает:
 * - resumeScore: оценка резюме (0-100)
 * - interviewScore: оценка интервью (0-100), опционально
 * - skillMatch: соответствие навыков (0-1), опционально
 *
 * Формула расчёта:
 * - Если есть только resumeScore: fitScore = resumeScore
 * - Если есть resumeScore и interviewScore: fitScore = (resumeScore * 0.4) + (interviewScore * 0.6)
 * - Если есть skillMatch: добавляется бонус до 10 баллов
 */

/**
 * Входные данные для расчёта fitScore
 */
export interface FitScoreInput {
  resumeScore: number;
  interviewScore?: number;
  skillMatch?: number; // 0-1, где 1 = полное соответствие навыков
}

/**
 * Результат расчёта fitScore с деталями
 */
export interface FitScoreResult {
  fitScore: number;
  breakdown: {
    resumeContribution: number;
    interviewContribution: number;
    skillBonus: number;
  };
  confidence: number; // Уверенность в оценке (0-100)
}

/**
 * Веса для расчёта fitScore
 */
const WEIGHTS = {
  resumeOnly: 1.0,
  resumeWithInterview: 0.4,
  interviewWeight: 0.6,
  maxSkillBonus: 10,
} as const;

/**
 * Валидирует значение score и приводит к диапазону [0, 100]
 */
function clampScore(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Валидирует значение skillMatch и приводит к диапазону [0, 1]
 */
function clampSkillMatch(value: number | undefined): number {
  if (value === undefined || typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

/**
 * Рассчитывает fitScore на основе входных данных
 *
 * @param input - Входные данные для расчёта
 * @returns fitScore в диапазоне [0, 100]
 *
 * @example
 * // Только resumeScore
 * calculateFitScore({ resumeScore: 75 }) // => 75
 *
 * @example
 * // resumeScore + interviewScore
 * calculateFitScore({ resumeScore: 70, interviewScore: 80 }) // => 76
 *
 * @example
 * // С бонусом за навыки
 * calculateFitScore({ resumeScore: 70, interviewScore: 80, skillMatch: 0.9 }) // => 85
 */
export function calculateFitScore(input: FitScoreInput): number {
  const result = calculateFitScoreDetailed(input);
  return result.fitScore;
}

/**
 * Рассчитывает fitScore с детальной разбивкой
 *
 * @param input - Входные данные для расчёта
 * @returns Результат с fitScore и разбивкой по компонентам
 */
export function calculateFitScoreDetailed(
  input: FitScoreInput,
): FitScoreResult {
  const resumeScore = clampScore(input.resumeScore);
  const interviewScore =
    input.interviewScore !== undefined
      ? clampScore(input.interviewScore)
      : undefined;
  const skillMatch = clampSkillMatch(input.skillMatch);

  let resumeContribution: number;
  let interviewContribution: number;
  let confidence: number;

  if (interviewScore !== undefined) {
    // Есть и resumeScore, и interviewScore
    resumeContribution = resumeScore * WEIGHTS.resumeWithInterview;
    interviewContribution = interviewScore * WEIGHTS.interviewWeight;
    confidence = 90; // Высокая уверенность при наличии обоих показателей
  } else {
    // Только resumeScore
    resumeContribution = resumeScore * WEIGHTS.resumeOnly;
    interviewContribution = 0;
    confidence = 60; // Средняя уверенность без интервью
  }

  // Бонус за соответствие навыков
  const skillBonus = skillMatch * WEIGHTS.maxSkillBonus;

  // Итоговый fitScore
  const rawFitScore = resumeContribution + interviewContribution + skillBonus;
  const fitScore = clampScore(rawFitScore);

  return {
    fitScore,
    breakdown: {
      resumeContribution: Math.round(resumeContribution * 10) / 10,
      interviewContribution: Math.round(interviewContribution * 10) / 10,
      skillBonus: Math.round(skillBonus * 10) / 10,
    },
    confidence,
  };
}

/**
 * Проверяет, является ли fitScore валидным (в диапазоне [0, 100])
 *
 * @param fitScore - Значение для проверки
 * @returns true если значение в допустимом диапазоне
 */
export function isValidFitScore(fitScore: number): boolean {
  return (
    typeof fitScore === "number" &&
    !Number.isNaN(fitScore) &&
    fitScore >= 0 &&
    fitScore <= 100
  );
}

/**
 * Категоризирует fitScore для UI отображения
 *
 * @param fitScore - Значение fitScore
 * @returns Категория: "excellent" | "good" | "average" | "low"
 */
export function categorizeFitScore(
  fitScore: number,
): "excellent" | "good" | "average" | "low" {
  if (fitScore >= 80) return "excellent";
  if (fitScore >= 60) return "good";
  if (fitScore >= 40) return "average";
  return "low";
}

/**
 * Возвращает рекомендуемое действие на основе fitScore
 *
 * @param fitScore - Значение fitScore
 * @returns Рекомендуемое действие: "invite" | "clarify" | "reject"
 */
export function getRecommendedAction(
  fitScore: number,
): "invite" | "clarify" | "reject" {
  if (fitScore >= 70) return "invite";
  if (fitScore >= 50) return "clarify";
  return "reject";
}
