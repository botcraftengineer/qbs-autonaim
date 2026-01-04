/**
 * Conversation Context Management для AI-ассистента рекрутера
 * Управляет загрузкой контекста (workspace, vacancy, company settings)
 * и накоплением истории диалога
 */

import type {
  ConversationMessage,
  RecruiterAgentContext,
  RecruiterCompanySettings,
  RecruiterConversationContext,
  RecruiterDecision,
} from "./types";

/**
 * Максимальное количество сообщений в истории диалога
 */
export const MAX_CONVERSATION_HISTORY = 20;

/**
 * Данные workspace для контекста
 */
export interface WorkspaceData {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
}

/**
 * Данные company settings для контекста
 */
export interface CompanySettingsData {
  name: string;
  description?: string | null;
  website?: string | null;
  botName?: string | null;
  botRole?: string | null;
}

/**
 * Данные вакансии для контекста
 */
export interface VacancyData {
  id: string;
  title: string;
  description?: string | null;
  requirements?: {
    job_title: string;
    summary: string;
    mandatory_requirements: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_years: {
      min: number | null;
      description: string;
    };
    languages: Array<{
      language: string;
      level: string;
    }>;
    location_type: string;
    keywords_for_matching: string[];
  } | null;
  customBotInstructions?: string | null;
  customInterviewQuestions?: string | null;
  customOrganizationalQuestions?: string | null;
}

/**
 * Входные данные для построения контекста
 */
export interface ContextBuilderInput {
  workspaceId: string;
  userId: string;
  vacancyId?: string;
  workspace?: WorkspaceData | null;
  companySettings?: CompanySettingsData | null;
  vacancy?: VacancyData | null;
  conversationHistory?: ConversationMessage[];
  recentDecisions?: RecruiterDecision[];
}

/**
 * Класс для управления контекстом диалога рекрутера
 */
export class RecruiterContextManager {
  private maxHistoryLength: number;

  constructor(maxHistoryLength: number = MAX_CONVERSATION_HISTORY) {
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Строит полный контекст для агентов
   */
  buildContext(input: ContextBuilderInput): RecruiterAgentContext {
    const companySettings = this.buildCompanySettings(
      input.workspace,
      input.companySettings,
    );

    const conversationHistory = this.limitHistory(
      input.conversationHistory || [],
    );

    return {
      // BaseAgentContext fields
      candidateId: undefined,
      conversationId: input.workspaceId,
      conversationHistory: conversationHistory.map((msg) => ({
        sender: msg.role === "user" ? ("CANDIDATE" as const) : ("BOT" as const),
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      vacancyTitle: input.vacancy?.title,
      vacancyDescription: input.vacancy?.description || undefined,
      vacancyRequirements: input.vacancy?.requirements
        ? JSON.stringify(input.vacancy.requirements)
        : undefined,
      companySettings: {
        botName: companySettings.botName,
        botRole: companySettings.botRole,
        name: companySettings.name,
        description: companySettings.description,
      },
      customBotInstructions: input.vacancy?.customBotInstructions,
      customInterviewQuestions: input.vacancy?.customInterviewQuestions,
      customOrganizationalQuestions:
        input.vacancy?.customOrganizationalQuestions,

      // RecruiterAgentContext fields
      workspaceId: input.workspaceId,
      userId: input.userId,
      currentVacancyId: input.vacancyId,
      recruiterConversationHistory: conversationHistory,
      recruiterCompanySettings: companySettings,
      recentDecisions: input.recentDecisions || [],
    };
  }

  /**
   * Строит RecruiterConversationContext для хранения состояния
   */
  buildConversationContext(
    input: ContextBuilderInput,
  ): RecruiterConversationContext {
    const companySettings = this.buildCompanySettings(
      input.workspace,
      input.companySettings,
    );

    return {
      workspaceId: input.workspaceId,
      userId: input.userId,
      currentVacancyId: input.vacancyId,
      conversationHistory: this.limitHistory(input.conversationHistory || []),
      companySettings,
      recentDecisions: input.recentDecisions || [],
    };
  }

  /**
   * Добавляет сообщение в историю диалога
   */
  addMessage(
    history: ConversationMessage[],
    message: Omit<ConversationMessage, "timestamp">,
  ): ConversationMessage[] {
    const newMessage: ConversationMessage = {
      ...message,
      timestamp: new Date(),
    };

    const updatedHistory = [...history, newMessage];
    return this.limitHistory(updatedHistory);
  }

  /**
   * Добавляет сообщение пользователя
   */
  addUserMessage(
    history: ConversationMessage[],
    content: string,
  ): ConversationMessage[] {
    return this.addMessage(history, {
      role: "user",
      content,
    });
  }

  /**
   * Добавляет сообщение ассистента
   */
  addAssistantMessage(
    history: ConversationMessage[],
    content: string,
    metadata?: ConversationMessage["metadata"],
  ): ConversationMessage[] {
    return this.addMessage(history, {
      role: "assistant",
      content,
      metadata,
    });
  }

  /**
   * Ограничивает историю диалога до максимального размера
   */
  limitHistory(history: ConversationMessage[]): ConversationMessage[] {
    if (history.length <= this.maxHistoryLength) {
      return history;
    }

    // Удаляем старые сообщения, сохраняя последние maxHistoryLength
    return history.slice(-this.maxHistoryLength);
  }

  /**
   * Обновляет текущую вакансию в контексте
   */
  updateCurrentVacancy(
    context: RecruiterConversationContext,
    vacancyId: string | undefined,
  ): RecruiterConversationContext {
    return {
      ...context,
      currentVacancyId: vacancyId,
    };
  }

  /**
   * Добавляет решение рекрутера для обучения
   */
  addDecision(
    context: RecruiterConversationContext,
    decision: Omit<RecruiterDecision, "id" | "timestamp">,
  ): RecruiterConversationContext {
    const newDecision: RecruiterDecision = {
      ...decision,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Храним последние 50 решений
    const recentDecisions = [...context.recentDecisions, newDecision].slice(
      -50,
    );

    return {
      ...context,
      recentDecisions,
    };
  }

  /**
   * Очищает историю диалога
   */
  clearHistory(
    context: RecruiterConversationContext,
  ): RecruiterConversationContext {
    return {
      ...context,
      conversationHistory: [],
    };
  }

  /**
   * Строит настройки компании из workspace и company settings
   */
  private buildCompanySettings(
    workspace?: WorkspaceData | null,
    companySettings?: CompanySettingsData | null,
  ): RecruiterCompanySettings {
    return {
      name: companySettings?.name || workspace?.name || "Компания",
      description:
        companySettings?.description || workspace?.description || undefined,
      botName: companySettings?.botName || "AI-ассистент",
      botRole: companySettings?.botRole || "рекрутер",
      communicationStyle: "professional",
      defaultAutonomyLevel: "advise",
    };
  }

  /**
   * Получает последние N сообщений из истории
   */
  getRecentMessages(
    history: ConversationMessage[],
    count: number,
  ): ConversationMessage[] {
    return history.slice(-count);
  }

  /**
   * Проверяет, есть ли в истории сообщения определенного типа
   */
  hasMessagesWithIntent(
    history: ConversationMessage[],
    intent: string,
  ): boolean {
    return history.some((msg) => msg.metadata?.intent === intent);
  }

  /**
   * Получает статистику по истории диалога
   */
  getHistoryStats(history: ConversationMessage[]): {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    intents: Record<string, number>;
  } {
    const stats = {
      totalMessages: history.length,
      userMessages: 0,
      assistantMessages: 0,
      intents: {} as Record<string, number>,
    };

    for (const msg of history) {
      if (msg.role === "user") {
        stats.userMessages++;
      } else {
        stats.assistantMessages++;
      }

      if (msg.metadata?.intent) {
        stats.intents[msg.metadata.intent] =
          (stats.intents[msg.metadata.intent] || 0) + 1;
      }
    }

    return stats;
  }
}

/**
 * Singleton instance для использования в приложении
 */
export const recruiterContextManager = new RecruiterContextManager();

/**
 * Хелпер для создания пустого контекста
 */
export function createEmptyContext(
  workspaceId: string,
  userId: string,
): RecruiterConversationContext {
  return {
    workspaceId,
    userId,
    currentVacancyId: undefined,
    conversationHistory: [],
    companySettings: {
      name: "Компания",
      botName: "AI-ассистент",
      botRole: "рекрутер",
      communicationStyle: "professional",
      defaultAutonomyLevel: "advise",
    },
    recentDecisions: [],
  };
}

/**
 * Хелпер для сериализации контекста (для хранения в Redis/DB)
 */
export function serializeContext(
  context: RecruiterConversationContext,
): string {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Date) {
      return { __type: "Date", value: value.toISOString() };
    }
    return value;
  });
}

/**
 * Хелпер для десериализации контекста
 */
export function deserializeContext(json: string): RecruiterConversationContext {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === "object" && value.__type === "Date") {
      return new Date(value.value);
    }
    return value;
  });
}
