/**
 * Мультиагентная система для интервью
 *
 * Экспорт всех агентов, типов и workflow
 */

export type { AIPoweredAgentConfig } from "./ai-powered-agent";
export { AIPoweredAgent } from "./ai-powered-agent";
// Базовые классы
export { BaseAgent } from "./base-agent";
// Конфигурация
export { AGENT_CONFIG, getAgentConfig } from "./config";

// Базовые агенты (требуют AI модель для работы)
export type {
  ContextAnalysisInput,
  ContextAnalysisOutput,
} from "./context-analyzer";
export { ContextAnalyzerAgent } from "./context-analyzer";
// Улучшенные агенты с AI SDK (рекомендуется использовать)
export type {
  EnhancedContextAnalysisInput,
  EnhancedContextAnalysisOutput,
} from "./enhanced-context-analyzer";
export { EnhancedContextAnalyzerAgent } from "./enhanced-context-analyzer";
export type {
  EnhancedEscalationInput,
  EnhancedEscalationOutput,
} from "./enhanced-escalation-detector";
export { EnhancedEscalationDetectorAgent } from "./enhanced-escalation-detector";
export type {
  EnhancedEvaluatorInput,
  EnhancedEvaluatorOutput,
} from "./enhanced-evaluator";
export { EnhancedEvaluatorAgent } from "./enhanced-evaluator";
export type {
  EnhancedInterviewerInput,
  EnhancedInterviewerOutput,
} from "./enhanced-interviewer";
export { EnhancedInterviewerAgent } from "./enhanced-interviewer";
export type { EscalationInput, EscalationOutput } from "./escalation-detector";
export { EscalationDetectorAgent } from "./escalation-detector";
export type { EvaluatorInput, EvaluatorOutput } from "./evaluator";
export { EvaluatorAgent } from "./evaluator";
export type { InterviewerInput, InterviewerOutput } from "./interviewer";
export { InterviewerAgent } from "./interviewer";

// Оркестратор
export type {
  OrchestratorConfig,
  OrchestratorInput,
  OrchestratorOutput,
} from "./orchestrator";
export { InterviewOrchestrator } from "./orchestrator";
// Инструменты
export {
  getConversationContext,
  getVoiceMessagesInfo,
} from "./tools";
// Типы
export type {
  AgentDecision,
  AgentResult,
  AgentType,
  BaseAgentContext,
  WorkflowState,
} from "./types";

export { convertLegacyContext } from "./utils/legacy-converter";
export type { InterviewWorkflowConfig } from "./workflows/interview-workflow";
// Workflow
export { InterviewWorkflow } from "./workflows/interview-workflow";
