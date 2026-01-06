/**
 * Evaluation Service
 *
 * Сервис для оценки соответствия кандидатов вакансиям.
 */

export { EvaluatorService, evaluatorService } from "./evaluator";
export {
  FeedbackGeneratorService,
  feedbackGeneratorService,
} from "./feedback-generator";
export type {
  DialogueMessage,
  DimensionScore,
  EvaluationErrorCode,
  EvaluationInput,
  EvaluationResult,
  FeedbackConfig,
  FitDecision,
  HonestyLevel,
  ParsedResume,
  VacancyData,
  VacancyRequirements,
  WorkspaceEvaluationConfig,
} from "./types";
export { EvaluationError } from "./types";
