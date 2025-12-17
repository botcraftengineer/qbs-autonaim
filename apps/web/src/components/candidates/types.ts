export type FunnelStage =
  | "NEW"
  | "REVIEW"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export interface FunnelCandidate {
  id: string;
  name: string;
  position: string;
  avatarFileId: string | null;
  initials: string;
  experience: string;
  location: string;
  skills: string[];
  matchScore: number;
  resumeScore?: number;
  interviewScore?: number;
  scoreAnalysis?: string;
  screeningAnalysis?: string;
  availability: string;
  salaryExpectation: string;
  stage: string;
  vacancyId: string;
  vacancyName: string;
  email: string | null;
  phone: string | null;
  github: string | null;
  telegram: string | null;
  resumeUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelComment {
  id: string;
  candidateId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
}

export interface FunnelActivity {
  id: string;
  candidateId: string;
  type: "STATUS_CHANGE" | "COMMENT" | "DOCUMENT" | "INTERVIEW" | "APPLIED";
  description: string;
  author?: string;
  createdAt: Date;
}

export const STAGE_LABELS: Record<FunnelStage, string> = {
  NEW: "Новые",
  REVIEW: "На рассмотрении",
  INTERVIEW: "Собеседование",
  OFFER: "Оффер",
  HIRED: "Наняты",
  REJECTED: "Отклонен",
};

export const STAGE_COLORS: Record<FunnelStage, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  REVIEW:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400",
  INTERVIEW:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400",
  OFFER:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
  HIRED:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
  REJECTED:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400",
};
