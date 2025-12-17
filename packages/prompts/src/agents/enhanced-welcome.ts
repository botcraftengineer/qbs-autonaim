/**
 * Агент для генерации приветственных сообщений
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface EnhancedWelcomeInput {
  companyName: string;
  companyDescription?: string;
  companyWebsite?: string;
  vacancyTitle?: string;
  vacancyDescription?: string;
  candidateName?: string;
  screeningScore?: number;
  screeningAnalysis?: string;
}

export interface EnhancedWelcomeOutput {
  message: string;
  shouldRequestVoice: boolean;
  confidence: number;
}

export class EnhancedWelcomeAgent extends AIPoweredAgent<
  EnhancedWelcomeInput,
  EnhancedWelcomeOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "EnhancedWelcome",
      AgentType.INTERVIEWER,
      buildWelcomeSystemPrompt(),
      config,
    );
  }

  protected validate(input: EnhancedWelcomeInput): boolean {
    return !!input.companyName;
  }

  protected buildPrompt(
    input: EnhancedWelcomeInput,
    _context: BaseAgentContext,
  ): string {
    const {
      companyName,
      companyDescription,
      companyWebsite,
      vacancyTitle,
      vacancyDescription,
      candidateName,
      screeningScore,
      screeningAnalysis,
    } = input;

    const interestLevel = screeningScore
      ? screeningScore >= 4
        ? "высокий"
        : screeningScore === 3
          ? "средний"
          : "базовый"
      : undefined;

    return `${this.systemPrompt}

ИНФОРМАЦИЯ О КОМПАНИИ:
Название: ${companyName}
${companyDescription ? `Описание: ${companyDescription}` : ""}
${companyWebsite ? `Сайт: ${companyWebsite}` : ""}

ИНФОРМАЦИЯ О ВАКАНСИИ:
Позиция: ${vacancyTitle || "Не указана"}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}

ИНФОРМАЦИЯ О КАНДИДАТЕ:
ФИО: ${candidateName || "Кандидат"}

РЕЗУЛЬТАТЫ СКРИНИНГА:
${
  screeningScore
    ? `Оценка: ${screeningScore}/5
Анализ: ${screeningAnalysis || "Не указан"}
Уровень интереса: ${interestLevel}`
    : "Скрининг не проведен"
}

Верни JSON:
{
  "message": "текст приветственного сообщения",
  "shouldRequestVoice": true,
  "confidence": 0.0-1.0
}`;
  }

  async execute(
    input: EnhancedWelcomeInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EnhancedWelcomeOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);
      const aiResponse = await this.generateAIResponse(prompt, {});
      const parsed = this.parseJSONResponse<EnhancedWelcomeOutput>(aiResponse);

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      return { success: true, data: parsed, metadata: { prompt } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}

function buildWelcomeSystemPrompt(): string {
  return `Ты — ЖИВОЙ рекрутер компании. Твоя задача — написать короткое персонализированное приветственное сообщение кандидату, который откликнулся на вакансию.

ТРЕБОВАНИЯ К СООБЩЕНИЮ:
- Обращайся к кандидату ТОЛЬКО ПО ИМЕНИ (первое слово из ФИО) на "ВЫ"
- Сообщение должно быть максимально коротким и естественным (2-3 предложения)
- Пиши как ЖИВОЙ ЧЕЛОВЕК в мессенджере, профессионально, но дружелюбно
- Покажи заинтересованность, но без излишнего энтузиазма
- НЕ упоминай оценки, скрининг или автоматизацию
- НЕ используй шаблонные фразы типа "рады сообщить", "благодарим за отклик"
- В КОНЦЕ обязательно попроси кандидата ответить ГОЛОСОВЫМ СООБЩЕНИЕМ на один короткий вопрос
- Вопрос должен быть простым и релевантным позиции (например: "Почему Вас заинтересовала эта позиция?" или "Какой опыт работы у Вас самый интересный?")
- Укажи, что ответ нужен именно голосом
- НЕ добавляй подпись или имя отправителя
- Создай впечатление, что это пишет живой человек, а не бот

СТИЛЬ:
- Пиши как в обычной переписке: просто, по-человечески, на "ВЫ"
- Используй эмодзи умеренно (1-2 максимум)
- Длина: 2-3 короткие предложения + просьба записать голосовое
- Тон: профессиональный, но дружелюбный и неформальный
- ВАЖНО: НЕ используй слово "привет" - используй "здравствуйте", "добрый день" или просто начни с имени

ОРГАНИЗАЦИОННЫЕ МОМЕНТЫ:
- Упомяни, что это первичное знакомство
- Дай понять, что процесс будет быстрым и удобным
- Создай ощущение персонального внимания`;
}
