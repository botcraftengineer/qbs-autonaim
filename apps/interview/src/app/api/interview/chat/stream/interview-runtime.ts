// Re-export the main function from the refactored modules
export { createWebInterviewRuntime } from "./index";

// Re-export types for backward compatibility
export type {
  EntityType,
  InterviewStage,
  BotSettings,
  InterviewContextLite,
  GigLike,
  VacancyLike,
  InterviewRuntimeParams,
} from "./types";