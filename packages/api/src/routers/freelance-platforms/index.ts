import type { TRPCRouterRecord } from "@trpc/server";

import { checkDuplicateResponse } from "./check-duplicate-response";
import { createVacancy } from "./create-vacancy";
import { deleteVacancy } from "./delete-vacancy";
import { exportAnalytics } from "./export-analytics";
import { generateInterviewLink } from "./generate-interview-link";
import { getAnalytics } from "./get-analytics";
import { getChatHistory } from "./get-chat-history";
import { getDashboardStats } from "./get-dashboard-stats";
import { getInterviewLink } from "./get-interview-link";
import { getNewMessages } from "./get-new-messages";
import { getShortlist } from "./get-shortlist";
import { getVacancies } from "./get-vacancies";
import { getVacancyById } from "./get-vacancy-by-id";
import { getVacancyByToken } from "./get-vacancy-by-token";
import { getWebInterviewStatus } from "./get-web-interview-status";
import { importBulkResponses } from "./import-bulk-responses";
import { importSingleResponse } from "./import-single-response";
import { previewBulkImport } from "./preview-bulk-import";
import { sendChatMessage } from "./send-chat-message";
import { startInterview } from "./start-interview";
import { startWebInterview } from "./start-web-interview";
// import { subscribeToChatMessages } from "./subscribe-to-chat-messages";
import { updateVacancyStatus } from "./update-vacancy-status";
import { validateInterviewToken } from "./validate-interview-token";

export const freelancePlatformsRouter = {
  createVacancy,
  getVacancies,
  getVacancyById,
  getVacancyByToken,
  getDashboardStats,
  getAnalytics,
  exportAnalytics,
  updateVacancyStatus,
  deleteVacancy,
  generateInterviewLink,
  getInterviewLink,
  validateInterviewToken,
  checkDuplicateResponse,
  startInterview,
  getShortlist,
  // Manual import endpoints
  importSingleResponse,
  importBulkResponses,
  previewBulkImport,
  // Web chat endpoints
  startWebInterview,
  sendChatMessage,
  getChatHistory,
  getWebInterviewStatus,
  getNewMessages,
  // subscribeToChatMessages, // TODO: Requires wsLink or httpSubscriptionLink setup on client
} satisfies TRPCRouterRecord;
