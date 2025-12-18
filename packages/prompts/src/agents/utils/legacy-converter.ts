/**
 * Утилита для конвертации legacy контекста в новый формат
 */

import type { TelegramRecruiterContext } from "../../telegram-recruiter/types";
import type { BaseAgentContext, WorkflowState } from "../types";

/**
 * Конвертирует legacy контекст в формат мультиагентной системы
 */
export function convertLegacyContext(legacy: TelegramRecruiterContext): {
  context: BaseAgentContext;
  state: WorkflowState;
} {
  const conversationHistory = (legacy.conversationHistory || []).map((msg) => ({
    sender: (msg.sender === "CANDIDATE" || msg.sender === "BOT"
      ? msg.sender
      : "CANDIDATE") as "CANDIDATE" | "BOT",
    content: msg.content,
    contentType: msg.contentType,
    timestamp: new Date(),
  }));

  const context: BaseAgentContext = {
    candidateName: legacy.candidateName || "Кандидат",
    vacancyTitle: legacy.vacancyTitle || "Вакансия",
    vacancyRequirements: legacy.vacancyRequirements,
    conversationHistory,
    resumeData: legacy.resumeData,
    customBotInstructions: legacy.customBotInstructions,
    customInterviewQuestions: legacy.customInterviewQuestions,
  };

  const voiceMessagesCount = conversationHistory.filter(
    (msg) => msg.sender === "CANDIDATE" && msg.contentType === "VOICE",
  ).length;

  // Маппинг legacy stage в новый формат
  let currentStage: WorkflowState["currentStage"] = "INTERVIEWING";
  if (legacy.stage === "AWAITING_PIN") currentStage = "AWAITING_PIN";
  else if (legacy.stage === "PIN_RECEIVED") currentStage = "PIN_RECEIVED";
  else if (legacy.stage === "ESCALATED") currentStage = "ESCALATED";
  else if (legacy.stage === "INVALID_PIN") currentStage = "AWAITING_PIN"; // Возвращаем к ожиданию PIN

  const state: WorkflowState = {
    currentStage,
    questionsAsked: 0,
    voiceMessagesCount,
    shouldContinue: true,
    metadata: {
      responseStatus: legacy.responseStatus,
      screeningScore: legacy.screeningScore,
      screeningAnalysis: legacy.screeningAnalysis,
      failedPinAttempts: legacy.failedPinAttempts,
    },
  };

  return { context, state };
}
