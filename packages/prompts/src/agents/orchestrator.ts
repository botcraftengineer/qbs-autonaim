/**
 * Оркестратор workflow интервью
 * Координирует работу всех агентов
 */

import type { LanguageModel } from "ai";
import { EnhancedContextAnalyzerAgent } from "./enhanced-context-analyzer";
import { EnhancedEscalationDetectorAgent } from "./enhanced-escalation-detector";
import { EnhancedEvaluatorAgent } from "./enhanced-evaluator";
import { EnhancedInterviewerAgent } from "./enhanced-interviewer";
import type { AgentDecision, BaseAgentContext, WorkflowState } from "./types";

export interface OrchestratorInput {
  message: string;
  currentState: WorkflowState;
  failedPinAttempts?: number;
  customQuestions?: string | null;
}

export interface OrchestratorOutput {
  response?: string;
  decision: AgentDecision;
  updatedState: WorkflowState;
  agentTrace: Array<{
    agent: string;
    input: unknown;
    output: unknown;
    timestamp: Date;
  }>;
}

export interface OrchestratorConfig {
  model: LanguageModel;
  maxTokens?: number;
  maxVoiceMessages?: number;
}

export class InterviewOrchestrator {
  private contextAnalyzer: EnhancedContextAnalyzerAgent;
  private escalationDetector: EnhancedEscalationDetectorAgent;
  private interviewer: EnhancedInterviewerAgent;
  private evaluator: EnhancedEvaluatorAgent;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = {
      ...config,
      maxVoiceMessages: config.maxVoiceMessages ?? 2,
    };

    const agentConfig = {
      model: config.model,
      maxTokens: config.maxTokens,
    };

    this.contextAnalyzer = new EnhancedContextAnalyzerAgent(agentConfig);
    this.escalationDetector = new EnhancedEscalationDetectorAgent(agentConfig);
    this.interviewer = new EnhancedInterviewerAgent(agentConfig);
    this.evaluator = new EnhancedEvaluatorAgent(agentConfig);
  }

  /**
   * Главный метод выполнения workflow
   */
  async execute(
    input: OrchestratorInput,
    context: BaseAgentContext,
  ): Promise<OrchestratorOutput> {
    const agentTrace: OrchestratorOutput["agentTrace"] = [];
    const startTime = new Date();

    try {
      // ШАГ 1: Анализ контекста сообщения
      const contextAnalysis = await this.contextAnalyzer.execute(
        {
          message: input.message,
          previousMessages: context.conversationHistory.slice(-5),
        },
        context,
      );

      agentTrace.push({
        agent: "ContextAnalyzer",
        input: { message: input.message },
        output: contextAnalysis.data,
        timestamp: new Date(),
      });

      // Проверяем успешность анализа контекста
      if (!contextAnalysis.success || !contextAnalysis.data) {
        return {
          decision: {
            action: "ESCALATE",
            reason: "Context analysis failed",
            confidence: 0.5,
          },
          updatedState: {
            ...input.currentState,
            currentStage: "ESCALATED",
          },
          agentTrace,
        };
      }

      // Если не требуется ответ (благодарность, "ок" и т.д.)
      if (!contextAnalysis.data.requiresResponse) {
        return {
          decision: {
            action: "SKIP",
            reason: "No response needed - simple acknowledgment",
            confidence: contextAnalysis.data.confidence,
          },
          updatedState: input.currentState,
          agentTrace,
        };
      }

      // ШАГ 2: Проверка необходимости эскалации
      const escalationCheck = await this.escalationDetector.execute(
        {
          message: input.message,
          failedPinAttempts: input.failedPinAttempts,
          conversationLength: context.conversationHistory.length,
        },
        context,
      );

      agentTrace.push({
        agent: "EscalationDetector",
        input: { message: input.message },
        output: escalationCheck.data,
        timestamp: new Date(),
      });

      if (escalationCheck.data?.shouldEscalate) {
        return {
          decision: {
            action: "ESCALATE",
            reason: escalationCheck.data.reason || "Escalation required",
            confidence: 1.0,
          },
          updatedState: {
            ...input.currentState,
            currentStage: "ESCALATED",
            escalationReason: escalationCheck.data.reason,
          },
          agentTrace,
        };
      }

      // ШАГ 3: Проведение интервью
      const interviewResult = await this.interviewer.execute(
        {
          message: input.message,
          voiceMessagesCount: input.currentState.voiceMessagesCount,
          maxVoiceMessages: this.config.maxVoiceMessages ?? 2,
          questionsAsked: input.currentState.questionsAsked,
          customQuestions: input.customQuestions,
        },
        context,
      );

      agentTrace.push({
        agent: "Interviewer",
        input: { message: input.message },
        output: interviewResult.data,
        timestamp: new Date(),
      });

      if (!interviewResult.success || !interviewResult.data) {
        throw new Error("Interview agent failed");
      }

      // Обновляем состояние
      const updatedState: WorkflowState = {
        ...input.currentState,
        questionsAsked: input.currentState.questionsAsked + 1,
        shouldContinue: interviewResult.data.shouldContinue,
        metadata: {
          ...input.currentState.metadata,
          lastQuestionType: interviewResult.data.questionType,
          processingTime: Date.now() - startTime.getTime(),
        },
      };

      // Определяем действие
      const action = interviewResult.data.shouldContinue
        ? "CONTINUE"
        : "COMPLETE";

      return {
        response: interviewResult.data.response,
        decision: {
          action,
          reason:
            action === "COMPLETE"
              ? "Interview completed"
              : "Continue interview",
          confidence: 0.9,
        },
        updatedState,
        agentTrace,
      };
    } catch (error) {
      // Обработка ошибок
      return {
        decision: {
          action: "ESCALATE",
          reason: `Error in workflow: ${error instanceof Error ? error.message : "Unknown"}`,
          confidence: 1.0,
        },
        updatedState: {
          ...input.currentState,
          currentStage: "ESCALATED",
        },
        agentTrace,
      };
    }
  }

  /**
   * Оценка всего интервью
   */
  async evaluateInterview(
    allQA: Array<{ question: string; answer: string }>,
    context: BaseAgentContext,
  ) {
    const results = [];

    for (const qa of allQA) {
      const result = await this.evaluator.execute(
        {
          question: qa.question,
          answer: qa.answer,
          allQA,
        },
        context,
      );
      results.push(result);
    }

    return results;
  }
}
