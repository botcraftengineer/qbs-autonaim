import type { TRPCRouterRecord } from "@trpc/server";

import { createVacancy } from "./create-vacancy";
import { generateInterviewLink } from "./generate-interview-link";
import { getInterviewLink } from "./get-interview-link";
import { getVacancies } from "./get-vacancies";
import { getVacancyById } from "./get-vacancy-by-id";
import { updateVacancyStatus } from "./update-vacancy-status";
import { validateInterviewToken } from "./validate-interview-token";

export const freelancePlatformsRouter = {
  createVacancy,
  getVacancies,
  getVacancyById,
  updateVacancyStatus,
  generateInterviewLink,
  getInterviewLink,
  validateInterviewToken,
} satisfies TRPCRouterRecord;
