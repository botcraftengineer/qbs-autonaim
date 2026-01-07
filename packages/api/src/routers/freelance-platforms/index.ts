import type { TRPCRouterRecord } from "@trpc/server";

import { checkDuplicateResponse } from "./check-duplicate-response";
import { createVacancy } from "./create-vacancy";
import { deleteVacancy } from "./delete-vacancy";
import { exportAnalytics } from "./export-analytics";
import { generateInterviewLink } from "./generate-interview-link";
import { getAnalytics } from "./get-analytics";
import { getChatHistory } from "./get-chat-history";
import { getDashboardStats } from "./get-dashboard-stats";
import { getInterviewByToken } from "./get-interview-by-token";
import { getInterviewContext } from "./get-interview-context";
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
import { retryAnalysis } from "./retry-analysis";
import { retryBulkImport } from "./retry-bulk-import";
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
  getInterviewByToken,
  getInterviewLink,
  validateInterviewToken,
  checkDuplicateResponse,
  startInterview,
  getShortlist,
  // Manual import endpoints
  importSingleResponse,
  importBulkResponses,
  previewBulkImport,
  retryAnalysis,
  retryBulkImport,
  // Web chat endpoints
  startWebInterview,
  sendChatMessage,
  getChatHistory,
  getWebInterviewStatus,
  getNewMessages,
  getInterviewContext,
  // subscribeToChatMessages, // TODO: Requires wsLink or httpSubscriptionLink setup on client
} satisfies TRPCRouterRecord;
