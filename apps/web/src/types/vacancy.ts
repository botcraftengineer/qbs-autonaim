import type { VacancyResponse as DbVacancyResponse } from "@qbs-autonaim/db/schema";

export type VacancyResponse = DbVacancyResponse & {
  screening?: {
    score: number;
    detailedScore: number;
    analysis: string | null;
  } | null;
  telegramInterviewScoring?: {
    score: number;
    detailedScore: number;
    analysis: string | null;
  } | null;
  conversation?: {
    id: string;
    chatId: string;
    candidateName: string | null;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  } | null;
};
