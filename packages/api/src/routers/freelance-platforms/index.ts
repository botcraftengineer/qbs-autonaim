import type { TRPCRouterRecord } from "@trpc/server";

import { checkDuplicateResponse } from "./check-duplicate-response";
import { createVacancy } from "./create-vacancy";
import { generateInterviewLink } from "./generate-interview-link";
import { getChatHistory } from "./get-chat-history";
import { getInterviewLink } from "./get-interview-link";
import { getNewMessages } from "./get-new-messages";
import { getVacancies } from "./get-vacancies";
import { getVacancyById } from "./get-vacancy-by-id";
import { getVacancyByToken } from "./get-vacancy-by-token";
import { getWebInterviewStatus } from "./get-web-interview-status";
import { sendChatMessage } from "./send-chat-message";
import { startInterview } from "./start-interview";
import { startWebInterview } from "./start-web-interview";
import { updateVacancyStatus } from "./update-vacancy-status";
import { validateInterviewToken } from "./validate-interview-token";

export const freelancePlatformsRouter = {
  createVacancy,
  getVacancies,
  getVacancyById,
  getVacancyByToken,
  updateVacancyStatus,
  generateInterviewLink,
  getInterviewLink,
  validateInterviewToken,
  checkDuplicateResponse,
  startInterview,
  // Web chat endpoints
  startWebInterview,
  sendChatMessage,
  getChatHistory,
  getWebInterviewStatus,
  getNewMessages,
} satisfies TRPCRouterRecord;
