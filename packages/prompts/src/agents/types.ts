/**
 * Типы для мультиагентной системы интервью
 */

/**
 * Базовый контекст для всех агентов
 */
export interface BaseAgentContext {
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    contentType?: "TEXT" | "VOICE";
    timestamp?: Date;
  }>;
  candidateName?: string;
  vacancyTitle?: string;
  vacancyRequirements?: string;
  resumeData?: {
    experience?: string;
    coverLetter?: string;
    phone?: string;
  };
  customBotInstructions?: string | null;
  customInterviewQuestions?: string | null;
}

/**
 * Результат работы агента
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Типы агентов в системе
 */
export enum AgentType {
  ORCHESTRATOR = "orchestrator",
  SCREENER = "screener",
  INTERVIEWER = "interviewer",
  EVALUATOR = "evaluator",
  ESCALATION_DETECTOR = "escalation_detector",
  CONTEXT_ANALYZER = "context_analyzer",
}

/**
 * Состояние workflow
 */
export interface WorkflowState {
  currentStage:
    | "AWAITING_PIN"
    | "PIN_RECEIVED"
    | "INTERVIEWING"
    | "COMPLETED"
    | "ESCALATED";
  voiceMessagesCount: number;
  questionsAsked: number;
  shouldContinue: boolean;
  escalationReason?: string;
  metadata: Record<string, unknown>;
}

/**
 * Решение агента
 */
export interface AgentDecision {
  action: "CONTINUE" | "ESCALATE" | "COMPLETE" | "SKIP";
  reason: string;
  nextStep?: string;
  confidence: number; // 0-1
}
