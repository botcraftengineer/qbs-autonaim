/**
 * Centralized export for all Inngest functions
 */

// Candidate functions
export * from "./candidate";

// Response functions
export * from "./response";
// Telegram functions
export * from "./telegram";
// Vacancy functions
export * from "./vacancy";

import {
  sendCandidateWelcomeBatchFunction,
  sendCandidateWelcomeFunction,
} from "./candidate";

import {
  parseMissingContactsFunction,
  parseNewResumesFunction,
  refreshSingleResumeFunction,
  screenAllResponsesFunction,
  screenNewResponsesFunction,
  screenResponseFunction,
  screenResponsesBatchFunction,
} from "./response";
import {
  analyzeInterviewFunction,
  completeInterviewFunction,
  sendNextQuestionFunction,
  sendTelegramMessageFunction,
  transcribeVoiceFunction,
} from "./telegram";
// Re-export all functions as array for server registration
import {
  collectChatIdsFunction,
  extractVacancyRequirementsFunction,
  refreshVacancyResponsesFunction,
  updateSingleVacancyFunction,
  updateVacanciesFunction,
} from "./vacancy";

export const inngestFunctions = [
  // Vacancy
  collectChatIdsFunction,
  extractVacancyRequirementsFunction,
  refreshVacancyResponsesFunction,
  updateSingleVacancyFunction,
  updateVacanciesFunction,
  // Response
  parseMissingContactsFunction,
  parseNewResumesFunction,
  refreshSingleResumeFunction,
  screenAllResponsesFunction,
  screenNewResponsesFunction,
  screenResponseFunction,
  screenResponsesBatchFunction,
  // Candidate
  sendCandidateWelcomeBatchFunction,
  sendCandidateWelcomeFunction,
  // Telegram
  analyzeInterviewFunction,
  completeInterviewFunction,
  sendNextQuestionFunction,
  sendTelegramMessageFunction,
  transcribeVoiceFunction,
];
