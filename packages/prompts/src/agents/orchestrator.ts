/**
 * Оркестратор для голосовых интервью
 * Использует Orchestrator-Worker pattern из AI SDK workflows
 */

import type { LanguageModel } from "ai";
import type { Langfuse } from "langfuse";
import { EscalationDetectorAgent } from "./escalation-detector";
import type { InterviewerInput } from "./interviewer";
import { InterviewerAgent } from "./interviewer";
import type { BaseAgentContext } from "./types";

export interface OrchestratorInput {
  currentAnswer: string;
  currentQuestion: string;
  previousQA: Array<{ question: string; answer: string }>;
  questionNumber: number;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null; // Технические вопросы
  resumeLanguage?: string;
  interviewStage?: "ORGANIZATIONAL" | "TECHNICAL"; // Этап интервью
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
  langfuse?: Langfuse;
}

/**
 * Orchestrator-Worker pattern:
 * - Orchestrator координирует выполнение
 * - Workers (EscalationDetector, Interviewer) выполняют специализированные задачи
 */
export class InterviewOrchestrator {
  private model: LanguageModel;
  private maxSteps: number;
  private langfuse?: Langfuse;

  constructor(config: OrchestratorConfig) {
    this.model = config.model;
    this.maxSteps = config.maxSteps || 10;
    this.langfuse = config.langfuse;
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

    const trace = this.langfuse?.trace({
      name: "interview-orchestrator",
      userId: context.candidateId,
      metadata: {
        conversationId: context.conversationId,
        questionNumber: input.questionNumber,
        vacancyTitle: context.vacancyTitle,
        conversationHistoryLength: context.conversationHistory.length,
        hasCustomOrganizationalQuestions: !!input.customOrganizationalQuestions,
        hasCustomTechnicalQuestions: !!input.customInterviewQuestions,
        resumeLanguage: input.resumeLanguage,
        interviewStage: input.interviewStage || "ORGANIZATIONAL",
        companyName: context.companySettings?.name,
        botName: context.companySettings?.botName,
      },
      input: {
        currentAnswer: input.currentAnswer,
        currentQuestion: input.currentQuestion,
        questionNumber: input.questionNumber,
        previousQACount: input.previousQA.length,
        interviewStage: input.interviewStage || "ORGANIZATIONAL",
      },
    });

    const traceId = trace?.id;

    // Создаем агентов с traceId для каждого вызова
    const escalationDetector = new EscalationDetectorAgent({
      model: this.model,
      maxSteps: this.maxSteps,
      langfuse: this.langfuse,
      traceId,
    });

    const interviewer = new InterviewerAgent({
      model: this.model,
      maxSteps: this.maxSteps,
      langfuse: this.langfuse,
      traceId,
    });

    try {
      // ШАГ 1: Проверка необходимости эскалации
      const escalationInput = {
        message: input.currentAnswer,
        conversationLength: context.conversationHistory.length,
      };

      const escalationCheck = await escalationDetector.execute(
        escalationInput,
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
        const output = {
          analysis:
            escalationCheck.data.suggestedAction ||
            "Требуется эскалация к рекрутеру",
          shouldContinue: false,
          shouldEscalate: true,
          escalationReason: escalationCheck.data.reason,
          reason: escalationCheck.data.reason,
          agentTrace,
        };

        trace?.update({
          output,
          metadata: {
            escalated: true,
            escalationReason: escalationCheck.data.reason,
            escalationUrgency: escalationCheck.data?.urgency,
            agentTraceCount: agentTrace.length,
          },
        });

        await this.langfuse?.flushAsync();

        return output;
      }

      // ШАГ 2: Генерация следующего вопроса
      const interviewerInput: InterviewerInput = {
        currentAnswer: input.currentAnswer,
        currentQuestion: input.currentQuestion,
        previousQA: input.previousQA,
        questionNumber: input.questionNumber,
        customOrganizationalQuestions: input.customOrganizationalQuestions,
        customInterviewQuestions: input.customInterviewQuestions,
        resumeLanguage: input.resumeLanguage,
        interviewStage: input.interviewStage,
      };

      const interviewResult = await interviewer.execute(
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

      const output = {
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

      trace?.update({
        output,
        metadata: {
          escalated: false,
          shouldContinue: interviewResult.data.shouldContinue,
          confidence: interviewResult.data.confidence,
          waitingForCandidateResponse:
            interviewResult.data.waitingForCandidateResponse,
          isSimpleAcknowledgment: interviewResult.data.isSimpleAcknowledgment,
          agentTraceCount: agentTrace.length,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    } catch (error) {
      const output = {
        analysis: "Ошибка при обработке",
        shouldContinue: false,
        shouldEscalate: true,
        escalationReason: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        agentTrace,
      };

      trace?.update({
        output,
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : "Unknown",
          agentTraceCount: agentTrace.length,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    }
  }
}
