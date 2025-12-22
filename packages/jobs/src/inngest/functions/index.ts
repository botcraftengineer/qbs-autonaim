/**
 * Centralized export for all Inngest functions
 */

// Candidate functions
export * from "./candidate";

// Integration functions
export * from "./integration";

// Interview functions
export * from "./interview";

// Response functions
export * from "./response";
// Telegram functions
export * from "./telegram";
// Vacancy functions
export * from "./vacancy";

import {
  sendCandidateWelcomeBatchFunction,
  sendCandidateWelcomeFunction,
  sendOfferFunction,
} from "./candidate";

import { verifyHHCredentialsFunction } from "./integration";

import {
  bufferDebounceFunction,
  bufferFlushFunction,
  typingActivityFunction,
} from "./interview";

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
  notifyTelegramAuthErrorFunction,
  processIncomingMessageFunction,
  sendNextQuestionFunction,
  sendTelegramMessageByUsernameFunction,
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
  sendOfferFunction,
  // Integration
  verifyHHCredentialsFunction,
  // Interview
  bufferDebounceFunction,
  bufferFlushFunction,
  typingActivityFunction,
  // Telegram
  analyzeInterviewFunction,
  completeInterviewFunction,
  notifyTelegramAuthErrorFunction,
  processIncomingMessageFunction,
  sendNextQuestionFunction,
  sendTelegramMessageFunction,
  sendTelegramMessageByUsernameFunction,
  transcribeVoiceFunction,
];
