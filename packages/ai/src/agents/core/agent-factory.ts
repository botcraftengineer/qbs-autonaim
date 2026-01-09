/**
 * Централизованная фабрика для создания агентов с автоматической передачей langfuse
 */

import { env } from "@qbs-autonaim/config";
import type { LanguageModel } from "ai";
import { Langfuse } from "langfuse";
import { ContextAnalyzerAgent } from "../detection/context-analyzer";
import { EscalationDetectorAgent } from "../detection/escalation-detector";
import { GreetingDetectorAgent } from "../detection/greeting-detector";
import { ResumeStructurerAgent } from "../extraction/resume-structurer";
import { SalaryExtractionAgent } from "../extraction/salary-extraction";
import { EscalationHandlerAgent } from "../handlers/escalation-handler";
import { PinHandlerAgent } from "../handlers/pin-handler";
import { WelcomeAgent } from "../handlers/welcome";
import { InterviewCompletionAgent } from "../interview/interview-completion";
import { InterviewScoringAgent } from "../interview/interview-scoring";
import { InterviewStartAgent } from "../interview/interview-start";
import { InterviewerAgent } from "../interview/interviewer";
import type { AgentConfig } from "./base-agent";

export interface AgentFactoryConfig {
  model: LanguageModel;
  langfuse?: Langfuse | undefined;
  traceId?: string;
  maxSteps?: number;
}

let globalLangfuse: Langfuse | undefined;

/**
 * Получает или создает singleton инстанс Langfuse
 * Возвращает undefined если ключи не настроены (graceful degradation)
 */
function getLangfuseInstance(): Langfuse | undefined {
  if (globalLangfuse === undefined) {
    // Проверяем наличие переменных окружения
    const secretKey = env.LANGFUSE_SECRET_KEY;
    const publicKey = env.LANGFUSE_PUBLIC_KEY;
    const baseUrl = env.LANGFUSE_BASE_URL;

    if (!secretKey || !publicKey) {
      console.warn(
        "[Langfuse] LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY are not set. Tracing will be disabled.",
      );
      globalLangfuse = undefined;
      return undefined;
    }

    globalLangfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl,
    });
  }

  return globalLangfuse;
}

/**
 * Фабрика для создания агентов с централизованной конфигурацией
 */
export class AgentFactory {
  private config: AgentFactoryConfig;
  private langfuse: Langfuse | undefined;

  constructor(config: AgentFactoryConfig) {
    this.config = config;
    // Используем переданный langfuse или создаем глобальный singleton
    this.langfuse = config.langfuse ?? getLangfuseInstance();
  }

  private getAgentConfig(overrides?: Partial<AgentConfig>): AgentConfig {
    return {
      model: this.config.model,
      langfuse: this.langfuse,
      traceId: this.config.traceId,
      maxSteps: this.config.maxSteps,
      ...overrides,
    };
  }

  createContextAnalyzer(overrides?: Partial<AgentConfig>) {
    return new ContextAnalyzerAgent(this.getAgentConfig(overrides));
  }

  createEscalationDetector(overrides?: Partial<AgentConfig>) {
    return new EscalationDetectorAgent(this.getAgentConfig(overrides));
  }

  createEscalationHandler(overrides?: Partial<AgentConfig>) {
    return new EscalationHandlerAgent(this.getAgentConfig(overrides));
  }

  createGreetingDetector(overrides?: Partial<AgentConfig>) {
    return new GreetingDetectorAgent(this.getAgentConfig(overrides));
  }

  createInterviewCompletion(overrides?: Partial<AgentConfig>) {
    return new InterviewCompletionAgent(this.getAgentConfig(overrides));
  }

  createInterviewScoring(overrides?: Partial<AgentConfig>) {
    return new InterviewScoringAgent(this.getAgentConfig(overrides));
  }

  createInterviewStart(overrides?: Partial<AgentConfig>) {
    return new InterviewStartAgent(this.getAgentConfig(overrides));
  }

  createInterviewer(overrides?: Partial<AgentConfig>) {
    return new InterviewerAgent(this.getAgentConfig(overrides));
  }

  createPinHandler(overrides?: Partial<AgentConfig>) {
    return new PinHandlerAgent(this.getAgentConfig(overrides));
  }

  createResumeStructurer(overrides?: Partial<AgentConfig>) {
    return new ResumeStructurerAgent(this.getAgentConfig(overrides));
  }

  createSalaryExtraction(overrides?: Partial<AgentConfig>) {
    return new SalaryExtractionAgent(this.getAgentConfig(overrides));
  }

  createWelcome(overrides?: Partial<AgentConfig>) {
    return new WelcomeAgent(this.getAgentConfig(overrides));
  }
}
