/**
 * CommunicationAgent - Агент для автоматической коммуникации с кандидатами
 * Генерирует персонализированные сообщения разных типов
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import type { CandidateResult, RecruiterAgentContext } from "../core/types";

/**
 * Тип сообщения
 */
export type MessageType =
  | "greeting"
  | "clarification"
  | "invite"
  | "followup"
  | "rejection";

/**
 * Канал отправки
 */
export type MessageChannel = "telegram" | "email" | "sms";

/**
 * Входные данные для генерации сообщения
 */
export interface CommunicationInput {
  type: MessageType;
  candidate: {
    id: string;
    name: string;
    position?: string;
    experience?: number;
    skills?: string[];
    previousInteractions?: Array<{
      type: string;
      date: Date;
      summary: string;
    }>;
  };
  vacancy?: {
    id: string;
    title: string;
    company?: string;
  };
  channel: MessageChannel;
  context?: {
    interviewDate?: Date;
    interviewTime?: string;
    interviewFormat?: "online" | "offline";
    interviewLink?: string;
    interviewAddress?: string;
    rejectionReason?: string;
    clarificationQuestions?: string[];
    customInstructions?: string;
  };
}

/**
 * Сгенерированное сообщение
 */
export interface GeneratedMessage {
  id: string;
  type: MessageType;
  channel: MessageChannel;
  subject?: string; // Для email
  body: string;
  candidateId: string;
  vacancyId?: string;
  personalizationFactors: string[];
  suggestedSendTime?: string; // ISO string для сериализации
  createdAt: string; // ISO string для сериализации
}

/**
 * Выходные данные генерации сообщения
 */
export interface CommunicationOutput {
  message: GeneratedMessage;
  alternatives?: GeneratedMessage[];
  warnings?: string[];
}

/**
 * Лог отправленного сообщения
 */
export interface MessageLog {
  id: string;
  messageId: string;
  candidateId: string;
  vacancyId?: string;
  type: MessageType;
  channel: MessageChannel;
  status: "sent" | "delivered" | "read" | "failed";
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

/**
 * Схема вывода для LLM
 */
const communicationOutputSchema = z.object({
  message: z.object({
    id: z.string(),
    type: z.enum([
      "greeting",
      "clarification",
      "invite",
      "followup",
      "rejection",
    ]),
    channel: z.enum(["telegram", "email", "sms"]),
    subject: z.string().optional(),
    body: z.string(),
    candidateId: z.string(),
    vacancyId: z.string().optional(),
    personalizationFactors: z.array(z.string()),
    suggestedSendTime: z.string().optional(),
    createdAt: z.string(),
  }),
  alternatives: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          "greeting",
          "clarification",
          "invite",
          "followup",
          "rejection",
        ]),
        channel: z.enum(["telegram", "email", "sms"]),
        subject: z.string().optional(),
        body: z.string(),
        candidateId: z.string(),
        vacancyId: z.string().optional(),
        personalizationFactors: z.array(z.string()),
        createdAt: z.string(),
      }),
    )
    .optional(),
  warnings: z.array(z.string()).optional(),
});

/**
 * Инструкции для агента коммуникации
 */
const COMMUNICATION_INSTRUCTIONS = `Ты - AI-ассистент рекрутера, специализирующийся на персонализированной коммуникации с кандидатами.

Твоя задача:
1. Генерировать персонализированные сообщения для кандидатов
2. Учитывать историю взаимодействий
3. Адаптировать стиль под канал коммуникации
4. Соблюдать tone of voice компании

Типы сообщений:
- greeting: первичное приветствие, знакомство
- clarification: уточняющие вопросы по резюме/опыту
- invite: приглашение на интервью
- followup: напоминание, follow-up после интервью
- rejection: вежливый отказ с обратной связью

Правила для Telegram:
- Короткие сообщения (до 500 символов)
- Неформальный, но профессиональный стиль
- Можно использовать эмодзи умеренно
- Обращение на "вы" или "ты" в зависимости от настроек

Правила для Email:
- Структурированное письмо с темой
- Формальный стиль
- Подпись с контактами
- Длина до 2000 символов

Правила для SMS:
- Максимально краткое (до 160 символов)
- Только ключевая информация
- Ссылка на подробности

Персонализация:
- Использовать имя кандидата
- Упоминать релевантный опыт/навыки
- Ссылаться на предыдущие взаимодействия
- Учитывать позицию и компанию

Правила отказа:
- Вежливый и уважительный тон
- Благодарность за время
- Конструктивная обратная связь (если уместно)
- Предложение оставаться на связи`;

/**
 * Агент для коммуникации с кандидатами
 */
export class CommunicationAgent extends BaseAgent<
  CommunicationInput,
  CommunicationOutput
> {
  constructor(config: AgentConfig) {
    super(
      "CommunicationAgent",
      AgentType.COMMUNICATION,
      COMMUNICATION_INSTRUCTIONS,
      communicationOutputSchema,
      config,
    );
  }

  protected validate(input: CommunicationInput): boolean {
    return (
      typeof input.candidate?.id === "string" &&
      typeof input.candidate?.name === "string" &&
      ["greeting", "clarification", "invite", "followup", "rejection"].includes(
        input.type,
      ) &&
      ["telegram", "email", "sms"].includes(input.channel)
    );
  }

  protected buildPrompt(
    input: CommunicationInput,
    context: RecruiterAgentContext,
  ): string {
    const historyContext = this.buildHistoryContext(context);
    const candidateContext = this.buildCandidateContext(input);
    const messageContext = this.buildMessageContext(input);

    return `
Запрос: Сгенерируй ${this.getMessageTypeLabel(input.type)} для кандидата

${candidateContext}

${messageContext}

Канал: ${input.channel}

${historyContext}

Настройки компании:
- Название: ${context.recruiterCompanySettings?.name || "Компания"}
- Стиль коммуникации: ${context.recruiterCompanySettings?.communicationStyle || "professional"}
- Имя бота: ${context.recruiterCompanySettings?.botName || "HR-менеджер"}

${input.context?.customInstructions ? `Дополнительные инструкции: ${input.context.customInstructions}` : ""}

Сгенерируй персонализированное сообщение.
`;
  }

  /**
   * Получает label для типа сообщения
   */
  private getMessageTypeLabel(type: MessageType): string {
    const labels: Record<MessageType, string> = {
      greeting: "приветственное сообщение",
      clarification: "уточняющее сообщение",
      invite: "приглашение на интервью",
      followup: "follow-up сообщение",
      rejection: "сообщение об отказе",
    };
    return labels[type];
  }

  /**
   * Строит контекст кандидата
   */
  private buildCandidateContext(input: CommunicationInput): string {
    const parts: string[] = [];

    parts.push(`Кандидат: ${input.candidate.name}`);
    parts.push(`ID: ${input.candidate.id}`);

    if (input.candidate.position) {
      parts.push(`Позиция: ${input.candidate.position}`);
    }
    if (input.candidate.experience) {
      parts.push(`Опыт: ${input.candidate.experience} лет`);
    }
    if (input.candidate.skills?.length) {
      parts.push(`Навыки: ${input.candidate.skills.join(", ")}`);
    }

    if (input.candidate.previousInteractions?.length) {
      parts.push("\nПредыдущие взаимодействия:");
      for (const interaction of input.candidate.previousInteractions.slice(
        -3,
      )) {
        parts.push(
          `- ${interaction.type} (${interaction.date.toLocaleDateString()}): ${interaction.summary}`,
        );
      }
    }

    return parts.join("\n");
  }

  /**
   * Строит контекст сообщения
   */
  private buildMessageContext(input: CommunicationInput): string {
    const parts: string[] = [];

    if (input.vacancy) {
      parts.push(`Вакансия: ${input.vacancy.title}`);
      if (input.vacancy.company) {
        parts.push(`Компания: ${input.vacancy.company}`);
      }
    }

    if (input.context) {
      if (input.context.interviewDate) {
        parts.push(
          `Дата интервью: ${input.context.interviewDate.toLocaleDateString()}`,
        );
      }
      if (input.context.interviewTime) {
        parts.push(`Время: ${input.context.interviewTime}`);
      }
      if (input.context.interviewFormat) {
        parts.push(
          `Формат: ${input.context.interviewFormat === "online" ? "онлайн" : "офлайн"}`,
        );
      }
      if (input.context.interviewLink) {
        parts.push(`Ссылка: ${input.context.interviewLink}`);
      }
      if (input.context.interviewAddress) {
        parts.push(`Адрес: ${input.context.interviewAddress}`);
      }
      if (input.context.rejectionReason) {
        parts.push(`Причина отказа: ${input.context.rejectionReason}`);
      }
      if (input.context.clarificationQuestions?.length) {
        parts.push(
          `Вопросы для уточнения:\n${input.context.clarificationQuestions.map((q) => `- ${q}`).join("\n")}`,
        );
      }
    }

    return parts.length > 0 ? parts.join("\n") : "";
  }

  /**
   * Строит контекст из истории диалога
   */
  private buildHistoryContext(context: RecruiterAgentContext): string {
    if (
      !context.recruiterConversationHistory ||
      context.recruiterConversationHistory.length === 0
    ) {
      return "";
    }

    const recentHistory = context.recruiterConversationHistory.slice(-3);
    const historyText = recentHistory
      .map(
        (msg) => `${msg.role === "user" ? "Рекрутер" : "AI"}: ${msg.content}`,
      )
      .join("\n");

    return `
Контекст диалога:
${historyText}
`;
  }

  /**
   * Генерирует приглашение на интервью
   */
  async generateInvite(
    candidate: CommunicationInput["candidate"],
    vacancy: CommunicationInput["vacancy"],
    interviewDetails: {
      date: Date;
      time: string;
      format: "online" | "offline";
      link?: string;
      address?: string;
    },
    channel: MessageChannel,
    context: RecruiterAgentContext,
  ): Promise<{
    success: boolean;
    data?: CommunicationOutput;
    error?: string;
  }> {
    return this.execute(
      {
        type: "invite",
        candidate,
        vacancy,
        channel,
        context: {
          interviewDate: interviewDetails.date,
          interviewTime: interviewDetails.time,
          interviewFormat: interviewDetails.format,
          interviewLink: interviewDetails.link,
          interviewAddress: interviewDetails.address,
        },
      },
      context,
    );
  }

  /**
   * Генерирует сообщение об отказе
   */
  async generateRejection(
    candidate: CommunicationInput["candidate"],
    vacancy: CommunicationInput["vacancy"],
    reason: string,
    channel: MessageChannel,
    context: RecruiterAgentContext,
  ): Promise<{
    success: boolean;
    data?: CommunicationOutput;
    error?: string;
  }> {
    return this.execute(
      {
        type: "rejection",
        candidate,
        vacancy,
        channel,
        context: {
          rejectionReason: reason,
        },
      },
      context,
    );
  }

  /**
   * Генерирует follow-up сообщение
   */
  async generateFollowup(
    candidate: CommunicationInput["candidate"],
    vacancy: CommunicationInput["vacancy"],
    channel: MessageChannel,
    context: RecruiterAgentContext,
    customInstructions?: string,
  ): Promise<{
    success: boolean;
    data?: CommunicationOutput;
    error?: string;
  }> {
    return this.execute(
      {
        type: "followup",
        candidate,
        vacancy,
        channel,
        context: {
          customInstructions,
        },
      },
      context,
    );
  }

  /**
   * Генерирует сообщение для кандидата из CandidateResult
   */
  async generateMessageForCandidate(
    candidateResult: CandidateResult,
    type: MessageType,
    vacancy: CommunicationInput["vacancy"],
    channel: MessageChannel,
    context: RecruiterAgentContext,
    additionalContext?: CommunicationInput["context"],
  ): Promise<{
    success: boolean;
    data?: CommunicationOutput;
    error?: string;
  }> {
    return this.execute(
      {
        type,
        candidate: {
          id: candidateResult.id,
          name: candidateResult.name,
        },
        vacancy,
        channel,
        context: additionalContext,
      },
      context,
    );
  }
}

/**
 * Логгер сообщений для аудита
 */
export class MessageLogger {
  private logs: MessageLog[] = [];

  /**
   * Логирует отправку сообщения
   */
  logSent(message: GeneratedMessage): MessageLog {
    const log: MessageLog = {
      id: crypto.randomUUID(),
      messageId: message.id,
      candidateId: message.candidateId,
      vacancyId: message.vacancyId,
      type: message.type,
      channel: message.channel,
      status: "sent",
      sentAt: new Date(),
    };

    this.logs.push(log);
    return log;
  }

  /**
   * Обновляет статус доставки
   */
  updateDelivered(messageId: string): void {
    const log = this.logs.find((l) => l.messageId === messageId);
    if (log) {
      log.status = "delivered";
      log.deliveredAt = new Date();
    }
  }

  /**
   * Обновляет статус прочтения
   */
  updateRead(messageId: string): void {
    const log = this.logs.find((l) => l.messageId === messageId);
    if (log) {
      log.status = "read";
      log.readAt = new Date();
    }
  }

  /**
   * Логирует ошибку отправки
   */
  logError(messageId: string, error: string): void {
    const log = this.logs.find((l) => l.messageId === messageId);
    if (log) {
      log.status = "failed";
      log.error = error;
    }
  }

  /**
   * Получает логи по кандидату
   */
  getLogsByCandidate(candidateId: string): MessageLog[] {
    return this.logs.filter((l) => l.candidateId === candidateId);
  }

  /**
   * Получает логи по вакансии
   */
  getLogsByVacancy(vacancyId: string): MessageLog[] {
    return this.logs.filter((l) => l.vacancyId === vacancyId);
  }

  /**
   * Получает все логи
   */
  getAllLogs(): MessageLog[] {
    return [...this.logs];
  }
}
