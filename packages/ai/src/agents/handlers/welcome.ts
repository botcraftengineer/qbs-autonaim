/**
 * Агент для генерации приветственного сообщения
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface WelcomeInput {
  candidateName?: string;
  vacancyTitle?: string;
  companyName?: string;
  customWelcomeMessage?: string | null;
}

const welcomeOutputSchema = z.object({
  welcomeMessage: z.string(),
  confidence: z.number().min(0).max(1),
});

export type WelcomeOutput = z.infer<typeof welcomeOutputSchema>;

export class WelcomeAgent extends BaseAgent<WelcomeInput, WelcomeOutput> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — рекрутер, который приветствует кандидата в Telegram.

ЗАДАЧА:
Создай теплое приветственное сообщение для кандидата.

ПРАВИЛА:
- ОБРАЩЕНИЕ: используй ТОЛЬКО имя кандидата (без фамилии и отчества)
- Если имя не определено или неясно — НЕ обращайся по имени, просто "Добрый день" или "Здравствуйте"
- Упомяни вакансию если известна
- Будь дружелюбным и профессиональным
- Пиши естественно, как живой человек
- Обращайся на "вы"
- Используй 1-2 эмодзи для теплоты
- Сообщение должно быть коротким (2-3 предложения)

ПРИМЕРЫ:
- "Добрый день, Иван! 👋 Спасибо за отклик на вакансию Frontend Developer. Давайте познакомимся?"
- "Здравствуйте, Мария! Рады вашему интересу к позиции в нашей команде. Готовы ответить на несколько вопросов?"
- "Добрый день! 👋 Спасибо за отклик на вакансию. Давайте познакомимся?" (если имя неизвестно)`;

    super(
      "Welcome",
      AgentType.SCREENER,
      instructions,
      welcomeOutputSchema,
      config,
    );
  }

  protected validate(_input: WelcomeInput): boolean {
    return true;
  }

  protected buildPrompt(
    input: WelcomeInput,
    _context: BaseAgentContext,
  ): string {
    const { candidateName, vacancyTitle, companyName, customWelcomeMessage } =
      input;

    return `КОНТЕКСТ:
${candidateName ? `Имя кандидата: ${candidateName} (используй ТОЛЬКО это имя, без фамилии)` : "Имя неизвестно (НЕ обращайся по имени)"}
${vacancyTitle ? `Вакансия: ${vacancyTitle}` : "Вакансия не указана"}
${companyName ? `Компания: ${companyName}` : ""}
${customWelcomeMessage ? `\nКастомное сообщение от работодателя:\n${customWelcomeMessage}` : ""}

Создай приветственное сообщение для кандидата.

Верни JSON с полями:
- welcomeMessage: текст приветствия
- confidence: число от 0.0 до 1.0`;
  }
}
