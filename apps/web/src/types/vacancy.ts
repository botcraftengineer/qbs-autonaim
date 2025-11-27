export interface VacancyResponse {
  id: string;
  vacancyId: string;
  resumeUrl: string;
  candidateName: string | null;
  telegramUsername: string | null;
  status:
    | "NEW"
    | "EVALUATED"
    | "DIALOG_APPROVED"
    | "INTERVIEW_HH"
    | "INTERVIEW_WHATSAPP"
    | "COMPLETED"
    | "SKIPPED";
  hrSelectionStatus:
    | "INVITE"
    | "RECOMMENDED"
    | "NOT_RECOMMENDED"
    | "REJECTED"
    | null;
  experience: string | null;
  contacts: unknown;
  createdAt: Date;
  updatedAt: Date;
  screening?: {
    score: number;
    detailedScore: number;
    analysis: string | null;
    questions: unknown;
    greeting: string | null;
  } | null;
}
