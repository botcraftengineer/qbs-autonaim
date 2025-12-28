import type { TRPCRouterRecord } from "@trpc/server";

import { checkDuplicateResponse } from "./check-duplicate-response";
import { createVacancy } from "./create-vacancy";
import { generateInterviewLink } from "./generate-interview-link";
import { getInterviewLink } from "./get-interview-link";
import { getVacancies } from "./get-vacancies";
import { getVacancyById } from "./get-vacancy-by-id";
import { getVacancyByToken } from "./get-vacancy-by-token";
import { startInterview } from "./start-interview";
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
} satisfies TRPCRouterRecord;
