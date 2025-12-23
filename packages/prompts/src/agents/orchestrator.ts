/**
 * Оркестратор для голосовых интервью
 * Использует Orchestrator-Worker pattern из AI SDK workflows
 */

import type { LanguageModel } from "ai";
import type { Langfuse } from "langfuse";
import { ContextAnalyzerAgent } from "./context-analyzer";
import { EscalationDetectorAgent } from "./escalation-detector";
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
  messageType?: string;
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
 * - Workers (Detector, Analyzer, Interviewer) выполняют специализированные задачи
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

  async execute(
    input: OrchestratorInput,
    context: BaseAgentContext,
  ): Promise<OrchestratorOutput> {
    const agentTrace: OrchestratorOutput["agentTrace"] = [];

    const trace = this.langfuse?.trace({
      name: "interview-orchestrator",
      userId: context.candidateId,
      metadata: {
        conversationId: context.candidateId, // Use candidateId as conversation identifier in Langfuse
        questionNumber: input.questionNumber,
        vacancyTitle: context.vacancyTitle,
      },
      input,
    });

    const traceId = trace?.id;

    // Инициализация агентов
    const contextAnalyzer = new ContextAnalyzerAgent({
      model: this.model,
      traceId,
      langfuse: this.langfuse,
    });

    const escalationDetector = new EscalationDetectorAgent({
      model: this.model,
      traceId,
      langfuse: this.langfuse,
    });

    const interviewer = new InterviewerAgent({
      model: this.model,
      traceId,
      langfuse: this.langfuse,
    });

    try {
      // ШАГ 1: Анализ контекста
      const contextResult = await contextAnalyzer.execute(
        {
          message: input.currentAnswer,
          previousMessages: context.conversationHistory,
        },
        context,
      );

      agentTrace.push({
        agent: "ContextAnalyzer",
        decision: contextResult.success
          ? `type: ${contextResult.data?.messageType}`
          : "failed",
        timestamp: new Date(),
      });

      if (
        contextResult.success &&
        contextResult.data?.messageType === "ACKNOWLEDGMENT" &&
        !contextResult.data.requiresResponse
      ) {
        return {
          analysis: "Простое подтверждение, ответ не требуется",
          shouldContinue: false,
          isSimpleAcknowledgment: true,
          messageType: "ACKNOWLEDGMENT",
          agentTrace,
        };
      }

      // ШАГ 2: Проверка эскалации (если это не простое подтверждение)
      const escalationCheck = await escalationDetector.execute(
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

      // ШАГ 3: Генерация ответа через Interviewer
      const interviewerResult = await interviewer.execute(
        {
          ...input,
        },
        context,
      );

      agentTrace.push({
        agent: "Interviewer",
        decision: interviewerResult.success
          ? `shouldContinue: ${interviewerResult.data?.shouldContinue}`
          : "failed",
        timestamp: new Date(),
      });

      if (!interviewerResult.success || !interviewerResult.data) {
        throw new Error("Interviewer agent failed");
      }

      return {
        ...interviewerResult.data,
        agentTrace,
      };
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
