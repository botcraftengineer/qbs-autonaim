/**
 * RecruiterAgentOrchestrator - Оркестратор для AI-ассистента рекрутера
 * Использует Orchestrator-Worker pattern для координации специализированных агентов
 */

import type { LanguageModel } from "ai";
import { Langfuse } from "langfuse";
import type { AgentConfig } from "../base-agent";
import { CandidateSearchAgent } from "./candidate-search";
import { CommunicationAgent } from "./communication";
import { ContentGeneratorAgent } from "./content-generator";
import { IntentClassifierAgent } from "./intent-classifier";
import type { RecruiterStreamEvent as StreamEvent } from "./streaming";
import type {
  AgentTraceEntry,
  ExecutedAction,
  RecruiterAgentContext,
  RecruiterCompanySettings,
  RecruiterIntent,
  RecruiterOrchestratorConfig,
  RecruiterOrchestratorInput,
  RecruiterOrchestratorOutput,
  VacancyAnalytics,
} from "./types";
import { VacancyAnalyticsAgent } from "./vacancy-analytics";

export interface RecruiterOrchestratorFullConfig
  extends RecruiterOrchestratorConfig {
  model: LanguageModel;
  langfuse?: Langfuse | undefined;
}

let globalLangfuse: Langfuse | undefined;

/**
 * Получает или создает singleton инстанс Langfuse
 * Возвращает undefined если ключи не настроены (graceful degradation)
 */
function getLangfuseInstance(): Langfuse | undefined {
  if (globalLangfuse === undefined) {
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const baseUrl = process.env.LANGFUSE_BASE_URL;

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
 * Оркестратор для AI-ассистента рекрутера
 * Координирует работу специализированных агентов:
 * - IntentClassifier: определение намерения пользователя
 * - CandidateSearchAgent: поиск кандидатов
 * - VacancyAnalyticsAgent: аналитика вакансий
 * - ContentGeneratorAgent: генерация контента
 * - CommunicationAgent: автопереписка
 * - RuleEngine: автономные решения
 */
export class RecruiterAgentOrchestrator {
  private model: LanguageModel;
  private maxSteps: number;
  private maxConversationHistory: number;
  private langfuse: Langfuse | undefined;
  private enableStreaming: boolean;

  constructor(config: RecruiterOrchestratorFullConfig) {
    this.model = config.model;
    this.maxSteps = config.maxSteps || 10;
    this.maxConversationHistory = config.maxConversationHistory || 20;
    this.langfuse = config.langfuse ?? getLangfuseInstance();
    this.enableStreaming = config.enableStreaming ?? true;
  }

  /**
   * Выполняет запрос рекрутера
   */
  async execute(
    input: RecruiterOrchestratorInput,
    companySettings: RecruiterCompanySettings = {},
  ): Promise<RecruiterOrchestratorOutput> {
    const agentTrace: AgentTraceEntry[] = [];
    const actions: ExecutedAction[] = [];

    // Создаем trace в Langfuse (если доступен)
    const trace = this.langfuse?.trace({
      name: "recruiter-agent-orchestrator",
      userId: input.workspaceId,
      metadata: {
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        messageLength: input.message.length,
        historyLength: input.conversationHistory.length,
      },
      input: {
        message: input.message,
        vacancyId: input.vacancyId,
      },
    });

    const traceId = trace?.id;

    try {
      // Подготавливаем контекст для агентов
      const context = this.buildAgentContext(input, companySettings);

      // ШАГ 1: Классификация намерения
      const intentResult = await this.classifyIntent(
        input,
        context,
        traceId,
        agentTrace,
      );

      // ШАГ 2: Роутинг к соответствующему агенту
      const response = await this.routeToAgent(
        intentResult.intent,
        input,
        context,
        traceId,
        agentTrace,
        actions,
      );

      const output: RecruiterOrchestratorOutput = {
        response,
        intent: intentResult.intent,
        actions,
        agentTrace,
      };

      // Обновляем trace
      trace?.update({
        output,
        metadata: {
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          actionsCount: actions.length,
          success: true,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("[RecruiterOrchestrator] Error:", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        agentTrace,
      });

      const output: RecruiterOrchestratorOutput = {
        response:
          "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз или переформулируйте вопрос.",
        intent: "GENERAL_QUESTION",
        actions,
        agentTrace,
      };

      trace?.update({
        output,
        metadata: {
          error: true,
          errorMessage,
          agentTraceCount: agentTrace.length,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    }
  }

  /**
   * Выполняет запрос рекрутера с streaming
   */
  async executeWithStreaming(
    input: RecruiterOrchestratorInput,
    companySettings: RecruiterCompanySettings = {},
    onEvent: (event: StreamEvent) => void,
  ): Promise<RecruiterOrchestratorOutput> {
    const agentTrace: AgentTraceEntry[] = [];
    const actions: ExecutedAction[] = [];

    // Отправляем событие начала
    onEvent({
      type: "start",
      timestamp: new Date(),
      message: "Обрабатываю ваш запрос...",
    });

    // Создаем trace в Langfuse (если доступен)
    const trace = this.langfuse?.trace({
      name: "recruiter-agent-orchestrator-streaming",
      userId: input.workspaceId,
      metadata: {
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        messageLength: input.message.length,
        historyLength: input.conversationHistory.length,
        streaming: true,
      },
      input: {
        message: input.message,
        vacancyId: input.vacancyId,
      },
    });

    const traceId = trace?.id;

    try {
      // Подготавливаем контекст для агентов
      const context = this.buildAgentContext(input, companySettings);

      // ШАГ 1: Классификация намерения
      const intentResult = await this.classifyIntent(
        input,
        context,
        traceId,
        agentTrace,
      );

      // Отправляем событие определения намерения
      onEvent({
        type: "intent",
        timestamp: new Date(),
        intent: intentResult.intent,
        confidence: intentResult.confidence,
      });

      // ШАГ 2: Роутинг к соответствующему агенту с streaming
      const response = await this.routeToAgentWithStreaming(
        intentResult.intent,
        input,
        context,
        traceId,
        agentTrace,
        actions,
        onEvent,
      );

      const output: RecruiterOrchestratorOutput = {
        response,
        intent: intentResult.intent,
        actions,
        agentTrace,
      };

      // Отправляем событие завершения
      onEvent({
        type: "complete",
        timestamp: new Date(),
        output,
      });

      // Обновляем trace
      trace?.update({
        output,
        metadata: {
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          actionsCount: actions.length,
          success: true,
          streaming: true,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("[RecruiterOrchestrator] Streaming error:", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        agentTrace,
      });

      // Отправляем событие ошибки
      onEvent({
        type: "error",
        timestamp: new Date(),
        error: errorMessage,
        code: "ORCHESTRATOR_ERROR",
      });

      const output: RecruiterOrchestratorOutput = {
        response:
          "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз или переформулируйте вопрос.",
        intent: "GENERAL_QUESTION",
        actions,
        agentTrace,
      };

      trace?.update({
        output,
        metadata: {
          error: true,
          errorMessage,
          agentTraceCount: agentTrace.length,
          streaming: true,
        },
      });

      await this.langfuse?.flushAsync();

      return output;
    }
  }

  /**
   * Роутинг к агенту с поддержкой streaming
   */
  private async routeToAgentWithStreaming(
    intent: RecruiterIntent,
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    actions: ExecutedAction[],
    onEvent: (event: StreamEvent) => void,
  ): Promise<string> {
    const actionId = crypto.randomUUID();

    // Отправляем событие начала действия
    onEvent({
      type: "action_start",
      timestamp: new Date(),
      actionId,
      actionType: intent,
      description: this.getIntentDescription(intent),
    });

    agentTrace.push({
      agent: "Router",
      decision: `routing to ${intent} handler with streaming`,
      timestamp: new Date(),
    });

    // Отправляем событие прогресса
    onEvent({
      type: "action_progress",
      timestamp: new Date(),
      actionId,
      progress: 30,
      message: "Анализирую запрос...",
    });

    // Выполняем роутинг
    const response = await this.routeToAgent(
      intent,
      input,
      context,
      traceId,
      agentTrace,
      actions,
    );

    // Отправляем текстовый чанк
    onEvent({
      type: "text_chunk",
      timestamp: new Date(),
      chunk: response,
      isPartial: false,
    });

    // Создаем действие
    const action: ExecutedAction = {
      id: actionId,
      type: intent,
      params: { message: input.message },
      result: "success",
      explanation: this.getIntentDescription(intent),
      timestamp: new Date(),
      canUndo: false,
    };

    actions.push(action);

    // Отправляем событие завершения действия
    onEvent({
      type: "action_complete",
      timestamp: new Date(),
      action,
    });

    return response;
  }

  /**
   * Получает описание намерения для UI
   */
  private getIntentDescription(intent: RecruiterIntent): string {
    const descriptions: Record<RecruiterIntent, string> = {
      SEARCH_CANDIDATES: "Поиск подходящих кандидатов",
      ANALYZE_VACANCY: "Анализ эффективности вакансии",
      GENERATE_CONTENT: "Генерация контента",
      COMMUNICATE: "Подготовка сообщения",
      CONFIGURE_RULES: "Настройка правил автоматизации",
      GENERAL_QUESTION: "Обработка запроса",
    };
    return descriptions[intent] || "Обработка запроса";
  }

  /**
   * Классифицирует намерение пользователя через LLM
   */
  private async classifyIntent(
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
  ): Promise<{ intent: RecruiterIntent; confidence: number }> {
    // Используем LLM для классификации намерения
    const intentClassifier = new IntentClassifierAgent(
      this.getAgentConfig(traceId),
    );

    const result = await intentClassifier.execute(
      {
        message: input.message,
        conversationHistory: input.conversationHistory,
        currentVacancyId: input.vacancyId,
      },
      context,
    );

    if (result.success && result.data) {
      agentTrace.push({
        agent: "IntentClassifier",
        decision: `intent: ${result.data.intent} (confidence: ${result.data.confidence})`,
        timestamp: new Date(),
      });

      return {
        intent: result.data.intent,
        confidence: result.data.confidence,
      };
    }

    // Fallback на GENERAL_QUESTION при ошибке LLM
    agentTrace.push({
      agent: "IntentClassifier",
      decision: "fallback to GENERAL_QUESTION (LLM error)",
      timestamp: new Date(),
    });

    return {
      intent: "GENERAL_QUESTION",
      confidence: 0.5,
    };
  }

  /**
   * Роутинг к соответствующему агенту на основе намерения
   */
  private async routeToAgent(
    intent: RecruiterIntent,
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "Router",
      decision: `routing to ${intent} handler`,
      timestamp: new Date(),
    });

    switch (intent) {
      case "SEARCH_CANDIDATES":
        return this.handleSearchCandidates(
          input,
          context,
          traceId,
          agentTrace,
          actions,
        );

      case "ANALYZE_VACANCY":
        return this.handleAnalyzeVacancy(
          input,
          context,
          traceId,
          agentTrace,
          actions,
        );

      case "GENERATE_CONTENT":
        return this.handleGenerateContent(
          input,
          context,
          traceId,
          agentTrace,
          actions,
        );

      case "COMMUNICATE":
        return this.handleCommunicate(
          input,
          context,
          traceId,
          agentTrace,
          actions,
        );

      case "CONFIGURE_RULES":
        return this.handleConfigureRules(
          input,
          context,
          traceId,
          agentTrace,
          actions,
        );

      default:
        return this.handleGeneralQuestion(
          input,
          context,
          traceId,
          agentTrace,
          actions,
        );
    }
  }

  /**
   * Обработчик поиска кандидатов
   * Использует CandidateSearchAgent для поиска и анализа кандидатов
   */
  private async handleSearchCandidates(
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    _actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "CandidateSearchAgent",
      decision: "executing candidate search",
      timestamp: new Date(),
    });

    const searchAgent = new CandidateSearchAgent(this.getAgentConfig(traceId));

    // Извлекаем параметры поиска из сообщения
    const searchInput = this.parseSearchQuery(input.message, input.vacancyId);

    const result = await searchAgent.execute(searchInput, context);

    if (result.success && result.data) {
      agentTrace.push({
        agent: "CandidateSearchAgent",
        decision: `found ${result.data.totalFound} candidates`,
        timestamp: new Date(),
      });

      return this.formatSearchResults(result.data);
    }

    agentTrace.push({
      agent: "CandidateSearchAgent",
      decision: `search failed: ${result.error}`,
      timestamp: new Date(),
    });

    return "Не удалось выполнить поиск кандидатов. Пожалуйста, попробуйте переформулировать запрос или уточните критерии поиска.";
  }

  /**
   * Парсит запрос поиска из сообщения пользователя
   */
  private parseSearchQuery(
    message: string,
    vacancyId?: string,
  ): {
    query: string;
    vacancyId: string;
    filters?: Record<string, unknown>;
    limit?: number;
  } {
    const filters: Record<string, unknown> = {};
    let limit = 10;

    // Извлекаем количество кандидатов
    const countMatch = message.match(/(\d+)\s*(кандидат|человек|специалист)/i);
    if (countMatch?.[1]) {
      limit = Math.min(parseInt(countMatch[1], 10), 50);
    }

    // Извлекаем доступность
    if (message.includes("сразу") || message.includes("немедленно")) {
      filters.availability = "immediately";
    } else if (message.includes("2 недел") || message.includes("две недел")) {
      filters.availability = "2 weeks";
    } else if (message.includes("месяц")) {
      filters.availability = "1 month";
    }

    // Извлекаем минимальный fitScore
    const scoreMatch = message.match(/score\s*[>>=]\s*(\d+)/i);
    if (scoreMatch?.[1]) {
      filters.minFitScore = parseInt(scoreMatch[1], 10);
    }

    return {
      query: message,
      vacancyId: vacancyId || "current",
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      limit,
    };
  }

  /**
   * Форматирует результаты поиска для отображения
   */
  private formatSearchResults(data: {
    candidates: Array<{
      name: string;
      fitScore: number;
      whySelected: string;
      recommendation: { action: string; reason: string };
      riskFactors: Array<{ description: string; severity: string }>;
    }>;
    searchExplanation: string;
    totalFound: number;
  }): string {
    if (data.candidates.length === 0) {
      return `${data.searchExplanation}\n\nПопробуйте расширить критерии поиска или изменить фильтры.`;
    }

    const candidatesList = data.candidates
      .map((c, i) => {
        const riskInfo =
          c.riskFactors.length > 0
            ? `\n   ⚠️ Риски: ${c.riskFactors.map((r) => r.description).join(", ")}`
            : "";
        const actionEmoji =
          c.recommendation.action === "invite"
            ? "✅"
            : c.recommendation.action === "clarify"
              ? "❓"
              : "❌";

        return `${i + 1}. **${c.name}** (fitScore: ${c.fitScore}%)
   ${c.whySelected}
   ${actionEmoji} ${c.recommendation.reason}${riskInfo}`;
      })
      .join("\n\n");

    return `${data.searchExplanation}

${candidatesList}

Хотите узнать подробнее о каком-то кандидате или выполнить действие?`;
  }

  /**
   * Обработчик анализа вакансии
   * Использует VacancyAnalyticsAgent для анализа эффективности вакансии
   */
  private async handleAnalyzeVacancy(
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    _actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "VacancyAnalyticsAgent",
      decision: "executing vacancy analysis",
      timestamp: new Date(),
    });

    const analyticsAgent = new VacancyAnalyticsAgent(
      this.getAgentConfig(traceId),
    );

    // Определяем ID вакансии
    const vacancyId = input.vacancyId || context.currentVacancyId;

    if (!vacancyId) {
      agentTrace.push({
        agent: "VacancyAnalyticsAgent",
        decision: "no vacancy ID provided",
        timestamp: new Date(),
      });

      return "Для анализа вакансии необходимо указать вакансию. Пожалуйста, выберите вакансию или укажите её в запросе.";
    }

    const result = await analyticsAgent.execute(
      {
        vacancyId,
        question: input.message,
      },
      context,
    );

    if (result.success && result.data) {
      agentTrace.push({
        agent: "VacancyAnalyticsAgent",
        decision: `analysis complete: ${result.data.analysis.issues.length} issues found`,
        timestamp: new Date(),
      });

      return this.formatAnalyticsResults(result.data);
    }

    agentTrace.push({
      agent: "VacancyAnalyticsAgent",
      decision: `analysis failed: ${result.error}`,
      timestamp: new Date(),
    });

    return "Не удалось выполнить анализ вакансии. Пожалуйста, попробуйте еще раз или уточните запрос.";
  }

  /**
   * Форматирует результаты анализа вакансии для отображения
   */
  private formatAnalyticsResults(data: {
    analysis: VacancyAnalytics;
    summary: string;
    suggestions: string[];
  }): string {
    const parts: string[] = [];

    // Summary уже содержит форматированный текст
    parts.push(data.summary);

    // Добавляем детальные рекомендации, если есть
    if (data.suggestions.length > 0) {
      parts.push("");
      parts.push("**Что можно сделать:**");
      data.suggestions.slice(0, 3).forEach((suggestion, index) => {
        parts.push(`${index + 1}. ${suggestion}`);
      });
    }

    parts.push("");
    parts.push(
      "Хотите узнать подробнее о какой-то проблеме или получить помощь с исправлением?",
    );

    return parts.join("\n");
  }

  /**
   * Обработчик генерации контента
   * Использует ContentGeneratorAgent для создания текстов вакансий
   */
  private async handleGenerateContent(
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    _actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "ContentGeneratorAgent",
      decision: "executing content generation",
      timestamp: new Date(),
    });

    const contentAgent = new ContentGeneratorAgent(
      this.getAgentConfig(traceId),
    );

    // Парсим запрос для определения типа контента
    const contentRequest = this.parseContentRequest(input.message);

    const result = await contentAgent.execute(
      {
        type: contentRequest.type,
        position: contentRequest.position || "Специалист",
        context: contentRequest.context,
        tone:
          context.recruiterCompanySettings?.communicationStyle ??
          "professional",
        generateVariants: contentRequest.variants,
      },
      context,
    );

    if (result.success && result.data) {
      agentTrace.push({
        agent: "ContentGeneratorAgent",
        decision: `generated ${contentRequest.type} content`,
        timestamp: new Date(),
      });

      return this.formatContentResults(result.data, contentRequest.type);
    }

    agentTrace.push({
      agent: "ContentGeneratorAgent",
      decision: `generation failed: ${result.error}`,
      timestamp: new Date(),
    });

    return "Не удалось сгенерировать контент. Пожалуйста, уточните, что именно нужно создать (заголовок, описание, требования).";
  }

  /**
   * Парсит запрос на генерацию контента
   */
  private parseContentRequest(message: string): {
    type:
      | "title"
      | "description"
      | "requirements"
      | "benefits"
      | "full_vacancy";
    position?: string;
    context?: Record<string, unknown>;
    variants?: number;
  } {
    const messageLower = message.toLowerCase();

    // Определяем тип контента
    let type:
      | "title"
      | "description"
      | "requirements"
      | "benefits"
      | "full_vacancy" = "full_vacancy";

    if (messageLower.includes("заголов") || messageLower.includes("название")) {
      type = "title";
    } else if (messageLower.includes("описани")) {
      type = "description";
    } else if (messageLower.includes("требовани")) {
      type = "requirements";
    } else if (
      messageLower.includes("преимуществ") ||
      messageLower.includes("условия")
    ) {
      type = "benefits";
    }

    // Извлекаем позицию
    const positionMatch = message.match(
      /(?:для|на позицию|вакансию)\s+["«]?([^"»\n]+)["»]?/i,
    );
    const position = positionMatch?.[1]?.trim();

    // Проверяем нужны ли варианты
    const variantsMatch = message.match(/(\d+)\s*вариант/i);
    const variants = variantsMatch?.[1]
      ? parseInt(variantsMatch[1], 10)
      : undefined;

    return { type, position, variants };
  }

  /**
   * Форматирует результаты генерации контента
   */
  private formatContentResults(
    data: {
      primary: {
        title?: string;
        description?: string;
        requirements?: string;
        benefits?: string;
      };
      variants?: Array<{
        id: string;
        content: string;
        style: string;
      }>;
      seoKeywords: string[];
      suggestions: string[];
    },
    _type: string,
  ): string {
    const parts: string[] = [];

    parts.push("✨ **Сгенерированный контент:**\n");

    // Основной контент
    if (data.primary.title) {
      parts.push(`**Заголовок:**\n${data.primary.title}\n`);
    }
    if (data.primary.description) {
      parts.push(`**Описание:**\n${data.primary.description}\n`);
    }
    if (data.primary.requirements) {
      parts.push(`**Требования:**\n${data.primary.requirements}\n`);
    }
    if (data.primary.benefits) {
      parts.push(`**Преимущества:**\n${data.primary.benefits}\n`);
    }

    // Варианты для A/B
    if (data.variants && data.variants.length > 0) {
      parts.push("\n**Варианты для A/B тестирования:**");
      for (const [i, variant] of data.variants.entries()) {
        parts.push(`\n${i + 1}. (${variant.style})\n${variant.content}`);
      }
    }

    // SEO ключевые слова
    if (data.seoKeywords.length > 0) {
      parts.push(`\n**SEO ключевые слова:** ${data.seoKeywords.join(", ")}`);
    }

    // Рекомендации
    if (data.suggestions.length > 0) {
      parts.push("\n**Рекомендации:**");
      for (const s of data.suggestions) {
        parts.push(`• ${s}`);
      }
    }

    parts.push("\nХотите что-то изменить или сгенерировать другой вариант?");

    return parts.join("\n");
  }

  /**
   * Обработчик коммуникации с кандидатами
   * Использует CommunicationAgent для генерации персонализированных сообщений
   */
  private async handleCommunicate(
    input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    _actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "CommunicationAgent",
      decision: "executing message generation",
      timestamp: new Date(),
    });

    const communicationAgent = new CommunicationAgent(
      this.getAgentConfig(traceId),
    );

    // Парсим запрос для определения типа сообщения
    const messageRequest = this.parseMessageRequest(input.message, context);

    const result = await communicationAgent.execute(
      {
        type: messageRequest.type,
        candidate: messageRequest.candidate,
        vacancy: input.vacancyId
          ? { id: input.vacancyId, title: "Текущая вакансия" }
          : undefined,
        channel: messageRequest.channel,
        context: messageRequest.context,
      },
      context,
    );

    if (result.success && result.data) {
      agentTrace.push({
        agent: "CommunicationAgent",
        decision: `generated ${messageRequest.type} message for ${messageRequest.channel}`,
        timestamp: new Date(),
      });

      return this.formatMessageResults(result.data);
    }

    agentTrace.push({
      agent: "CommunicationAgent",
      decision: `generation failed: ${result.error}`,
      timestamp: new Date(),
    });

    return "Не удалось сгенерировать сообщение. Пожалуйста, уточните тип сообщения и данные кандидата.";
  }

  /**
   * Парсит запрос на генерацию сообщения
   */
  private parseMessageRequest(
    message: string,
    context: RecruiterAgentContext,
  ): {
    type: "greeting" | "clarification" | "invite" | "followup" | "rejection";
    candidate: { id: string; name: string };
    channel: "telegram" | "email" | "sms";
    context?: Record<string, unknown>;
  } {
    const messageLower = message.toLowerCase();

    // Определяем тип сообщения
    let type:
      | "greeting"
      | "clarification"
      | "invite"
      | "followup"
      | "rejection" = "greeting";

    if (messageLower.includes("приглаш") || messageLower.includes("интервью")) {
      type = "invite";
    } else if (
      messageLower.includes("отказ") ||
      messageLower.includes("отклон")
    ) {
      type = "rejection";
    } else if (
      messageLower.includes("уточн") ||
      messageLower.includes("вопрос")
    ) {
      type = "clarification";
    } else if (
      messageLower.includes("напомн") ||
      messageLower.includes("follow")
    ) {
      type = "followup";
    }

    // Определяем канал
    let channel: "telegram" | "email" | "sms" = "telegram";

    if (
      messageLower.includes("email") ||
      messageLower.includes("почт") ||
      messageLower.includes("письмо")
    ) {
      channel = "email";
    } else if (messageLower.includes("sms") || messageLower.includes("смс")) {
      channel = "sms";
    }

    // Извлекаем имя кандидата (упрощённо)
    const nameMatch = message.match(
      /(?:для|кандидату?)\s+([А-ЯЁа-яё]+(?:\s+[А-ЯЁа-яё]+)?)/i,
    );
    const candidateName = nameMatch?.[1] || "Кандидат";

    // Извлекаем ID кандидата из сообщения или контекста
    let candidateId: string | undefined;

    // Пытаемся найти UUID в сообщении
    const uuidMatch = message.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    if (uuidMatch) {
      candidateId = uuidMatch[0];
    }

    // Если не нашли в сообщении, пытаемся извлечь из контекста
    if (!candidateId && context.candidateId) {
      candidateId = context.candidateId;
    }

    // Если ID не найден, логируем предупреждение
    if (!candidateId) {
      console.warn(
        "[RecruiterOrchestrator] candidateId not found in message or context. Message generation may fail.",
        { message: message.substring(0, 100) },
      );
      // Используем временный ID с префиксом для отладки
      candidateId = "missing-candidate-id";
    }

    return {
      type,
      candidate: {
        id: candidateId,
        name: candidateName,
      },
      channel,
    };
  }

  /**
   * Форматирует результаты генерации сообщения
   */
  private formatMessageResults(data: {
    message: {
      type: string;
      channel: string;
      subject?: string;
      body: string;
      personalizationFactors: string[];
    };
    alternatives?: Array<{
      body: string;
    }>;
    warnings?: string[];
  }): string {
    const parts: string[] = [];

    parts.push("📨 **Сгенерированное сообщение:**\n");

    if (data.message.subject) {
      parts.push(`**Тема:** ${data.message.subject}\n`);
    }

    parts.push(`**Текст:**\n${data.message.body}\n`);

    if (data.message.personalizationFactors.length > 0) {
      parts.push(
        `\n**Персонализация:** ${data.message.personalizationFactors.join(", ")}`,
      );
    }

    if (data.alternatives && data.alternatives.length > 0) {
      parts.push("\n**Альтернативные варианты:**");
      for (const [i, alt] of data.alternatives.entries()) {
        parts.push(`\n${i + 1}. ${alt.body.slice(0, 100)}...`);
      }
    }

    if (data.warnings && data.warnings.length > 0) {
      parts.push("\n⚠️ **Предупреждения:**");
      for (const w of data.warnings) {
        parts.push(`• ${w}`);
      }
    }

    parts.push("\nОтправить это сообщение или внести изменения?");

    return parts.join("\n");
  }

  /**
   * Обработчик настройки правил
   * TODO: Будет реализован в задаче 9 (RuleEngine)
   */
  private async handleConfigureRules(
    _input: RecruiterOrchestratorInput,
    _context: RecruiterAgentContext,
    _traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    _actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "RuleEngine",
      decision: "placeholder - agent not implemented yet",
      timestamp: new Date(),
    });

    return "Функция настройки правил автоматизации будет доступна в следующем обновлении.";
  }

  /**
   * Обработчик общих вопросов
   */
  private async handleGeneralQuestion(
    _input: RecruiterOrchestratorInput,
    context: RecruiterAgentContext,
    _traceId: string | undefined,
    agentTrace: AgentTraceEntry[],
    _actions: ExecutedAction[],
  ): Promise<string> {
    agentTrace.push({
      agent: "GeneralHandler",
      decision: "handling general question",
      timestamp: new Date(),
    });

    // Базовый ответ на общие вопросы
    const botName = context.recruiterCompanySettings?.botName || "AI-ассистент";

    return `Привет! Я ${botName}, ваш AI-ассистент для рекрутинга. Я могу помочь вам с:

• **Поиском кандидатов** — "Найди 5 кандидатов, готовых выйти за 2 недели"
• **Анализом вакансий** — "Почему у нас мало откликов?"
• **Генерацией контента** — "Напиши описание вакансии"
• **Коммуникацией** — "Напиши приглашение на интервью"
• **Настройкой правил** — "Создай правило для автоприглашения"

Чем могу помочь?`;
  }

  /**
   * Строит контекст для агентов
   */
  private buildAgentContext(
    input: RecruiterOrchestratorInput,
    companySettings: RecruiterCompanySettings,
  ): RecruiterAgentContext {
    // Ограничиваем историю диалога
    const limitedHistory = input.conversationHistory.slice(
      -this.maxConversationHistory,
    );

    return {
      // BaseAgentContext fields
      candidateId: undefined,
      conversationId: input.workspaceId,
      conversationHistory: limitedHistory.map((msg) => ({
        sender: msg.role === "user" ? ("CANDIDATE" as const) : ("BOT" as const),
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      companySettings: {
        botName: companySettings.botName,
        botRole: companySettings.botRole,
        name: companySettings.name,
        description: companySettings.description,
      },

      // RecruiterAgentContext fields
      workspaceId: input.workspaceId,
      userId: input.workspaceId, // TODO: получать реальный userId
      currentVacancyId: input.vacancyId,
      recruiterConversationHistory: limitedHistory,
      recruiterCompanySettings: companySettings,
      recentDecisions: [],
    };
  }

  /**
   * Получает конфигурацию для агентов
   */
  private getAgentConfig(traceId?: string): AgentConfig {
    return {
      model: this.model,
      langfuse: this.langfuse,
      traceId,
      maxSteps: this.maxSteps,
    };
  }
}
