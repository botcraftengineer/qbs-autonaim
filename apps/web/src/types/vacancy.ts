import type { VacancyResponse as DbVacancyResponse } from "@selectio/db/schema";

export type VacancyResponse = DbVacancyResponse & {
  screening?: {
    score: number;
    detailedScore: number;
    analysis: string | null;
  } | null;
  conversation?: {
    id: string;
    chatId: string;
    candidateName: string | null;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    metadata: string | null;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
      id: string;
      conversationId: string;
      sender: "CANDIDATE" | "BOT" | "ADMIN";
      contentType: "TEXT" | "VOICE";
      content: string;
      fileId: string | null;
      voiceDuration: string | null;
      telegramMessageId: string | null;
      createdAt: Date;
    }>;
  } | null;
};
