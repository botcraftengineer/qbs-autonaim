/**
 * Оркестратор для голосовых интервью
 * Использует Orchestrator-Worker pattern из AI SDK workflows
 */

import type { LanguageModel } from "ai";
import { EscalationDetectorAgent } from "./escalation-detector";
import type { InterviewerInput } from "./interviewer";
import { InterviewerAgent } from "./interviewer";
import type { BaseAgentContext } from "./types";

export interface OrchestratorInput {
  currentAnswer: string;
  currentQuestion: string;
  previousQA: Array<{ question: string; answer: string }>;
  questionNumber: number;
  customInterviewQuestions?: string | null;
  resumeLanguage?: string;
}

export interface OrchestratorOutput {
  analysis: string;
  shouldContinue: boolean;
  shouldEscalate?: boolean;
  escalationReason?: string;
  reason?: string;
  nextQuestion?: string;
  confidence?: number;
  waitingForCandidateResponse?: boolean;
  isSimpleAcknowledgment?: boolean;
  agentTrace: Array<{
    agent: string;
    decision: string;
    timestamp: Date;
  }>;
}

export interface OrchestratorConfig {
  model: LanguageModel;
  maxSteps?: number;
}

/**
 * Orchestrator-Worker pattern:
 * - Orchestrator координирует выполнение
 * - Workers (EscalationDetector, Interviewer) выполняют специализированные задачи
 */
export class InterviewOrchestrator {
  private escalationDetector: EscalationDetectorAgent;
  private interviewer: InterviewerAgent;

  constructor(config: OrchestratorConfig) {
    const agentConfig = {
      model: config.model,
      maxSteps: config.maxSteps || 10,
    };

    this.escalationDetector = new EscalationDetectorAgent(agentConfig);
    this.interviewer = new InterviewerAgent(agentConfig);
  }

  /**
   * Sequential Processing pattern:
   * 1. Проверка эскалации
   * 2. Генерация следующего вопроса
   */
  async execute(
    input: OrchestratorInput,
    context: BaseAgentContext,
  ): Promise<OrchestratorOutput> {
    const agentTrace: OrchestratorOutput["agentTrace"] = [];

    try {
      // ШАГ 1: Проверка необходимости эскалации
      const escalationCheck = await this.escalationDetector.execute(
        {
          message: input.currentAnswer,
          conversationLength: context.conversationHistory.length,
        },
        context,
      );

      agentTrace.push({
        agent: "EscalationDetector",
        decision: escalationCheck.success
          ? `shouldEscalate: ${escalationCheck.data?.shouldEscalate}`
          : "failed",
        timestamp: new Date(),
      });

      if (escalationCheck.success && escalationCheck.data?.shouldEscalate) {
        return {
          analysis:
            escalationCheck.data.suggestedAction ||
            "Требуется эскалация к рекрутеру",
          shouldContinue: false,
          shouldEscalate: true,
          escalationReason: escalationCheck.data.reason,
          reason: escalationCheck.data.reason,
          agentTrace,
        };
      }

      // ШАГ 2: Генерация следующего вопроса
      const interviewerInput: InterviewerInput = {
        currentAnswer: input.currentAnswer,
        currentQuestion: input.currentQuestion,
        previousQA: input.previousQA,
        questionNumber: input.questionNumber,
        customInterviewQuestions: input.customInterviewQuestions,
        resumeLanguage: input.resumeLanguage,
      };

      const interviewResult = await this.interviewer.execute(
        interviewerInput,
        context,
      );

      agentTrace.push({
        agent: "Interviewer",
        decision: interviewResult.success
          ? `shouldContinue: ${interviewResult.data?.shouldContinue}`
          : "failed",
        timestamp: new Date(),
      });

      if (!interviewResult.success || !interviewResult.data) {
        throw new Error("Interviewer agent failed");
      }

      return {
        analysis: interviewResult.data.analysis,
        shouldContinue: interviewResult.data.shouldContinue,
        reason: interviewResult.data.reason,
        nextQuestion: interviewResult.data.nextQuestion,
        confidence: interviewResult.data.confidence,
        waitingForCandidateResponse:
          interviewResult.data.waitingForCandidateResponse,
        isSimpleAcknowledgment: interviewResult.data.isSimpleAcknowledgment,
        agentTrace,
      };
    } catch (error) {
      return {
        analysis: "Ошибка при обработке",
        shouldContinue: false,
        shouldEscalate: true,
        escalationReason: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        agentTrace,
      };
    }
  }
}
