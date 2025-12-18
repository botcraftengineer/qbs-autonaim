export const RESPONSE_STATUS = {
  NEW: "NEW",
  EVALUATED: "EVALUATED",
  INTERVIEW_HH: "INTERVIEW_HH",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED",
} as const;

export type ResponseStatus =
  (typeof RESPONSE_STATUS)[keyof typeof RESPONSE_STATUS];

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  [RESPONSE_STATUS.NEW]: "Новый",
  [RESPONSE_STATUS.EVALUATED]: "Оценено",
  [RESPONSE_STATUS.INTERVIEW_HH]: "Собеседование HH.ru",
  [RESPONSE_STATUS.COMPLETED]: "Завершено",
  [RESPONSE_STATUS.SKIPPED]: "Пропущено",
};

export const RESPONSE_STATUS_DESCRIPTIONS: Record<ResponseStatus, string> = {
  [RESPONSE_STATUS.NEW]: "Только откликнулся, резюме не проанализировано",
  [RESPONSE_STATUS.EVALUATED]:
    "AI проанализировал резюме, выставлена оценка, предложен диалог",
  [RESPONSE_STATUS.INTERVIEW_HH]: "Активный диалог с кандидатом через HH.ru",
  [RESPONSE_STATUS.COMPLETED]:
    "Кандидат ответил на все вопросы, есть вывод по нему",
  [RESPONSE_STATUS.SKIPPED]: "Кандидат не ответил в срок (24 часа)",
};

export const HR_SELECTION_STATUS = {
  INVITE: "INVITE",
  RECOMMENDED: "RECOMMENDED",
  NOT_RECOMMENDED: "NOT_RECOMMENDED",
  REJECTED: "REJECTED",
  SECURITY_PASSED: "SECURITY_PASSED",
  OFFER_SENT: "OFFER_SENT",
  CONTRACT_SENT: "CONTRACT_SENT",
  ONBOARDING: "ONBOARDING",
} as const;

export type HrSelectionStatus =
  (typeof HR_SELECTION_STATUS)[keyof typeof HR_SELECTION_STATUS];

export const HR_SELECTION_STATUS_LABELS: Record<HrSelectionStatus, string> = {
  [HR_SELECTION_STATUS.INVITE]: "Пригласить",
  [HR_SELECTION_STATUS.RECOMMENDED]: "Рекомендовано",
  [HR_SELECTION_STATUS.NOT_RECOMMENDED]: "Не рекомендовано",
  [HR_SELECTION_STATUS.REJECTED]: "Отклонено",
  [HR_SELECTION_STATUS.SECURITY_PASSED]: "СБ пройдена",
  [HR_SELECTION_STATUS.OFFER_SENT]: "Оффер отправлен",
  [HR_SELECTION_STATUS.CONTRACT_SENT]: "Договор отправлен",
  [HR_SELECTION_STATUS.ONBOARDING]: "Онбординг",
};

export const HR_SELECTION_STATUS_DESCRIPTIONS: Record<
  HrSelectionStatus,
  string
> = {
  [HR_SELECTION_STATUS.INVITE]: "AI рекомендует пригласить",
  [HR_SELECTION_STATUS.RECOMMENDED]: "Хороший кандидат, но есть вопросы",
  [HR_SELECTION_STATUS.NOT_RECOMMENDED]: "Не подходит по критериям",
  [HR_SELECTION_STATUS.REJECTED]: "HR вручную отклонил",
  [HR_SELECTION_STATUS.SECURITY_PASSED]:
    "Кандидат прошел проверку службы безопасности",
  [HR_SELECTION_STATUS.OFFER_SENT]: "Кандидату отправлено предложение о работе",
  [HR_SELECTION_STATUS.CONTRACT_SENT]: "Кандидату отправлен трудовой договор",
  [HR_SELECTION_STATUS.ONBOARDING]:
    "Сотрудник проходит адаптацию и введение в должность",
};
