/**
 * AI-ассистент рекрутера - экспорты модуля
 */

// Candidate Search Agent
export {
  type CandidateData,
  CandidateSearchAgent,
  type CandidateSearchInput,
  type CandidateSearchOutput,
} from "./candidate-search";
// Communication Agent
export {
  CommunicationAgent,
  type CommunicationInput,
  type CommunicationOutput,
  type GeneratedMessage,
  type MessageChannel,
  type MessageLog,
  MessageLogger,
  type MessageType,
} from "./communication";
// Content Generator Agent
export {
  ContentGeneratorAgent,
  type ContentGeneratorInput,
  type ContentGeneratorOutput,
  type ContentType,
  type ContentVariant,
} from "./content-generator";
// Context Management
export {
  type CompanySettingsData,
  type ContextBuilderInput,
  createEmptyContext,
  deserializeContext,
  MAX_CONVERSATION_HISTORY,
  RecruiterContextManager,
  recruiterContextManager,
  serializeContext,
  type VacancyData,
  type WorkspaceData,
} from "./context";
// Fit Score Calculation
export {
  calculateFitScore,
  calculateFitScoreDetailed,
  categorizeFitScore,
  type FitScoreInput,
  type FitScoreResult,
  getRecommendedAction,
  isValidFitScore,
} from "./fit-score";
// Intent Classifier
export {
  IntentClassifierAgent,
  type IntentClassifierInput,
  type IntentClassifierOutput,
} from "./intent-classifier";
// Market Analytics
export {
  type CompetitorVacancy,
  compareSalaryWithMarket,
  type FullMarketData,
  getMarketAnalyticsService,
  getMarketDataForVacancy,
  MarketAnalyticsService,
  type MarketComparisonResult,
  type MarketDataQuery,
  type MarketTrend,
  type SalaryMarketData,
} from "./market-analytics";
// Orchestrator
export {
  RecruiterAgentOrchestrator,
  type RecruiterOrchestratorFullConfig,
} from "./orchestrator";
// Streaming
export {
  ActionChainBuilder,
  type ActionCompleteEvent,
  type ActionProgressEvent,
  type ActionStartEvent,
  type CompleteEvent,
  createSSEStream,
  createStreamingResponse,
  type ErrorEvent,
  formatSSEEvent,
  type IntentEvent,
  parseSSEEvent,
  type RecruiterStreamEvent,
  RecruiterStreamingResponse,
  type StartEvent,
  type StreamEventCallback,
  type StreamEventType,
  type TextChunkEvent,
} from "./streaming";
// Types
export type {
  AgentTraceEntry,
  CandidateResult,
  ConversationMessage,
  ExecutedAction,
  IntentClassificationResult,
  Recommendation,
  RecruiterAgentContext,
  RecruiterCompanySettings,
  RecruiterConversationContext,
  RecruiterDecision,
  RecruiterIntent,
  RecruiterOrchestratorConfig,
  RecruiterOrchestratorInput,
  RecruiterOrchestratorOutput,
  VacancyAnalytics,
  VacancyIssue,
  VacancyRecommendation,
} from "./types";
// Vacancy Analytics Agent
export {
  type MarketData,
  VacancyAnalyticsAgent,
  type VacancyAnalyticsInput,
  type VacancyAnalyticsOutput,
  type VacancyData as VacancyAnalyticsVacancyData,
  type VacancyMetricsData,
} from "./vacancy-analytics";
