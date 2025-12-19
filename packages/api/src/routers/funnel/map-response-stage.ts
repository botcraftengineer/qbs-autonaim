/**
 * Единая функция маппинга статусов кандидата в стадию воронки найма
 *
 * Приоритет: hrSelectionStatus > status
 *
 * Логика:
 * 1. Если есть hrSelectionStatus - он имеет приоритет (более специфичный)
 * 2. Если нет hrSelectionStatus - смотрим на status
 *
 * Стадии воронки:
 * - NEW: Новый кандидат (status = "NEW")
 * - REVIEW: На рассмотрении (status = "EVALUATED")
 * - INTERVIEW: Собеседование (status = "INTERVIEW_HH")
 * - OFFER: Оффер (hrSelectionStatus = "OFFER")
 * - HIRED: Наняты (hrSelectionStatus = "INVITE" | "RECOMMENDED" | "SECURITY_PASSED" | "CONTRACT_SENT" | "ONBOARDING")
 * - REJECTED: Отклонены (hrSelectionStatus = "REJECTED" | "NOT_RECOMMENDED" или status = "SKIPPED" | "COMPLETED")
 */
export const mapResponseToStage = (
  status: string,
  hrSelectionStatus: string | null,
): string => {
  // Приоритет у hrSelectionStatus - он более специфичный
  if (hrSelectionStatus) {
    // Финальные успешные статусы
    if (
      hrSelectionStatus === "INVITE" ||
      hrSelectionStatus === "RECOMMENDED" ||
      hrSelectionStatus === "SECURITY_PASSED" ||
      hrSelectionStatus === "CONTRACT_SENT" ||
      hrSelectionStatus === "ONBOARDING"
    ) {
      return "HIRED";
    }
    // Оффер
    if (hrSelectionStatus === "OFFER") {
      return "OFFER";
    }
    // Отклонены
    if (
      hrSelectionStatus === "REJECTED" ||
      hrSelectionStatus === "NOT_RECOMMENDED"
    ) {
      return "REJECTED";
    }
  }

  // Если нет hrSelectionStatus, смотрим на status
  if (status === "SKIPPED" || status === "COMPLETED") {
    return "REJECTED";
  }
  if (status === "INTERVIEW_HH") {
    return "INTERVIEW";
  }
  if (status === "EVALUATED") {
    return "REVIEW";
  }
  return "NEW";
};
