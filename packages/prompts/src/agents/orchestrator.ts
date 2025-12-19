/**
 * Оркестратор для голосовых интервью
 * Координирует работу агентов: анализ контекста → проверка эскалации → генерация вопроса
 */

import type { LanguageModel } from "ai";
import { EnhancedContextAnalyzerAgent } from "./enhanced-context-analyzer";
import { EnhancedEscalationDetectorAgent } from "./enhanced-escalation-detector";
import { InterviewerAgent } from "./interviewer";
import type { BaseAgentContext } from "./types";

export interface OrchestratorInput {
  currentAnswer: string;
  currentQuestion: string;
  previousQA: Array<{ question: string; answer: string }>;
  questionNumber: number;
  customInterviewQuestions?: string | null;
  /**
   * Функция для проверки пин-кода (опционально)
   * Если передана, оркестратор автоматически проверит пин-код при его обнаружении
   */
  validatePinCode?: (pinCode: string) => Promise<{
    valid: boolean;
    error?: string;
  }>;
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
  /**
   * Информация о пин-коде (если был обнаружен)
   */
  pinCodeDetected?: {
    pinCode: string;
    valid: boolean;
    error?: string;
  };
  agentTrace: Array<{
    agent: string;
    decision: string;
    timestamp: Date;
  }>;
}

export interface OrchestratorConfig {
  model: LanguageModel;
  maxTokens?: number;
}

export class InterviewOrchestrator {
  private contextAnalyzer: EnhancedContextAnalyzerAgent;
  private escalationDetector: EnhancedEscalationDetectorAgent;
  private interviewer: InterviewerAgent;

  constructor(config: OrchestratorConfig) {
    const agentConfig = {
      model: config.model,
      maxTokens: config.maxTokens,
    };

    this.contextAnalyzer = new EnhancedContextAnalyzerAgent(agentConfig);
    this.escalationDetector = new EnhancedEscalationDetectorAgent(agentConfig);
    this.interviewer = new InterviewerAgent(agentConfig);
  }

  /**
   * Главный метод выполнения workflow
   */
  async execute(
    input: OrchestratorInput,
    context: BaseAgentContext,
  ): Promise<OrchestratorOutput> {
    const agentTrace: OrchestratorOutput["agentTrace"] = [];

    try {
      // ШАГ 1: Анализ контекста сообщения
      const contextAnalysis = await this.contextAnalyzer.execute(
        {
          message: input.currentAnswer,
          previousMessages: context.conversationHistory.slice(-5),
        },
        context,
      );

      agentTrace.push({
        agent: "ContextAnalyzer",
        decision: contextAnalysis.success
          ? `messageType: ${contextAnalysis.data?.messageType}, requiresResponse: ${contextAnalysis.data?.requiresResponse}`
          : "failed",
        timestamp: new Date(),
      });

      // ШАГ 1.1: Обработка пин-кода (если обнаружен)
      if (
        contextAnalysis.success &&
        contextAnalysis.data?.messageType === "PIN_CODE" &&
        contextAnalysis.data.extractedData?.pinCode
      ) {
        const pinCode = contextAnalysis.data.extractedData.pinCode;

        agentTrace.push({
          agent: "PinCodeDetector",
          decision: `Обнаружен пин-код: ${pinCode}`,
          timestamp: new Date(),
        });

        // Если передана функция валидации, проверяем пин-код
        if (input.validatePinCode) {
          const validation = await input.validatePinCode(pinCode);

          agentTrace.push({
            agent: "PinCodeValidator",
            decision: validation.valid
              ? "Пин-код валидный"
              : `Пин-код невалидный: ${validation.error}`,
            timestamp: new Date(),
          });

          return {
            analysis: validation.valid
              ? "Пин-код успешно проверен, можно начинать интервью"
              : `Неверный пин-код: ${validation.error || "Код не найден в базе"}`,
            shouldContinue: validation.valid,
            reason: validation.valid ? "PIN_VALIDATED" : "INVALID_PIN",
            pinCodeDetected: {
              pinCode,
              valid: validation.valid,
              error: validation.error,
            },
            agentTrace,
          };
        }

        // Если функция валидации не передана, просто информируем о пин-коде
        return {
          analysis: "Обнаружен пин-код, но валидация не настроена",
          shouldContinue: false,
          reason: "PIN_DETECTED_NO_VALIDATOR",
          pinCodeDetected: {
            pinCode,
            valid: false,
            error: "Валидация не настроена",
          },
          agentTrace,
        };
      }

      // Если не требуется ответ (благодарность, "ок" и т.д.)
      if (
        contextAnalysis.success &&
        contextAnalysis.data &&
        !contextAnalysis.data.requiresResponse
      ) {
        return {
          analysis: "Простое подтверждение, ответ не требуется",
          shouldContinue: false,
          reason: "No response needed",
          agentTrace,
        };
      }

      // ШАГ 2: Проверка необходимости эскалации
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

      // Если нужна эскалация
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

      // ШАГ 3: Генерация следующего вопроса
      const interviewResult = await this.interviewer.execute(input, context);

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
        agentTrace,
      };
    } catch (error) {
      // Обработка ошибок
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
