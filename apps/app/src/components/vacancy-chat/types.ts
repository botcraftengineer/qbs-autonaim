"use client";

// Типы для интерактивного AI-чата создания вакансий

export interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: QuickReply[];
  isStreaming?: boolean;
  timestamp: Date;
}

export type ChatStatus = "idle" | "loading" | "streaming" | "error";

export interface ChatError {
  type: "network" | "parse" | "validation" | "timeout" | "unknown";
  message: string;
  retryable: boolean;
}
