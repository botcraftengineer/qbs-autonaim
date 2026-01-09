/**
 * Агент для обработки эскалированных диалогов
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface EscalationHandlerInput {
  messageText: string;
  escalationReason?: string;
}

const escalationHandlerOutputSchema = z.object({
  responseMessage: z.string(),
  confidence: z.number().min(0).max(1),
});

export type EscalationHandlerOutput = z.infer<
  typeof escalationHandlerOutputSchema
>;

export class EscalationHandlerAgent extends BaseAgent<
  EscalationHandlerInput,
  EscalationHandlerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — рекрутер, который передаёт диалог коллеге.

ЗАДАЧА:
Вежливо сообщи кандидату, что передашь его вопрос/заявку коллеге.

ПРАВИЛА:
- Веди себя как обычный рекрутер, который просто передаёт дело другому специалисту
- НЕ упоминай ботов, AI или автоматические системы
- Будь вежлив и профессионален
- Обращайся на "вы"
- Пиши коротко (1-2 предложения)

ПРИМЕРЫ ХОРОШИХ ОТВЕТОВ:
- "Передам ваш вопрос коллеге, он свяжется с вами в ближайшее время"
- "Понял, сейчас передам вашу заявку нужному специалисту"
- "Хорошо, мой коллега свяжется с вами и всё обсудит"
- "Окей, передам информацию. С вами свяжутся в ближайшее время"

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- responseMessage: текст ответа кандидату
- confidence: число от 0.0 до 1.0`;

    super(
      "EscalationHandler",
      AgentType.ESCALATION_DETECTOR,
      instructions,
      escalationHandlerOutputSchema,
      config,
    );
  }

  protected validate(input: EscalationHandlerInput): boolean {
    return !!input.messageText;
  }

  protected buildPrompt(
    input: EscalationHandlerInput,
    context: BaseAgentContext,
  ): string {
    const { messageText, escalationReason } = input;
    const resumeLanguage = context.resumeData?.language || "ru";

    const languageInstruction = `⚠️ АДАПТАЦИЯ К ЯЗЫКУ: 
- Изначальный язык резюме: "${resumeLanguage}"
- Анализируй историю диалога и определи язык сообщений кандидата
- Отвечай на том языке, на котором пишет кандидат`;

    const historyText =
      context.conversationHistory.length > 0
        ? `ИСТОРИЯ ДИАЛОГА (для контекста):\n${context.conversationHistory
            .map(
              (msg) =>
                `${msg.sender === "CANDIDATE" ? "Кандидат" : "Ты"}: ${msg.content}`,
            )
            .join("\n")}\n`
        : "";

    return `${languageInstruction}

${historyText}⚠️ ЭТАП: ПЕРЕДАЧА КОЛЛЕГЕ
Этот диалог нужно передать другому специалисту.
${escalationReason ? `Причина: <escalation_reason>${escalationReason}</escalation_reason>` : ""}

НОВОЕ СООБЩЕНИЕ КАНДИДАТА: <message>${messageText}</message>

Создай вежливое сообщение о передаче диалога коллеге.

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- responseMessage: текст ответа
- confidence: число от 0.0 до 1.0`;
  }
}
