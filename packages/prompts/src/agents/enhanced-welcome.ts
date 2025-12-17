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
  customOrganizationalQuestions?: string | null;
}

export interface EnhancedWelcomeOutput {
  message: string;
  organizationalQuestions: string[];
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
      customOrganizationalQuestions,
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

${customOrganizationalQuestions ? `КАСТОМНЫЕ ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ:\n${customOrganizationalQuestions}` : ""}

Верни JSON:
{
  "message": "текст приветственного сообщения с организационными вопросами",
  "organizationalQuestions": ["вопрос 1", "вопрос 2", "вопрос 3"],
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
  return `Ты — ЖИВОЙ рекрутер компании. Твоя задача — написать приветственное сообщение кандидату с первым этапом интервью (организационные вопросы).

СТРУКТУРА СООБЩЕНИЯ:
1. Короткое приветствие (1-2 предложения)
2. Краткое объяснение процесса
3. Список из 3-5 организационных вопросов

ТРЕБОВАНИЯ К ПРИВЕТСТВИЮ:
- Обращайся к кандидату ТОЛЬКО ПО ИМЕНИ (первое слово из ФИО) на "ВЫ"
- Пиши как ЖИВОЙ ЧЕЛОВЕК в мессенджере, профессионально, но дружелюбно
- Покажи заинтересованность, но без излишнего энтузиазма
- НЕ упоминай оценки, скрининг или автоматизацию
- НЕ используй шаблонные фразы типа "рады сообщить", "благодарим за отклик"
- НЕ добавляй подпись или имя отправителя
- ВАЖНО: НЕ используй слово "привет" - используй "здравствуйте", "добрый день" или просто начни с имени

ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ:
Если предоставлены кастомные вопросы - используй их как основу, адаптируя под естественный стиль.
Если нет - сформулируй стандартные организационные вопросы:
- Готовность к релокации (если релевантно)
- Формат работы (офис/удаленка/гибрид)
- Ожидания по зарплате
- Сроки выхода на работу
- График работы

ФОРМАТ ВОПРОСОВ:
- Каждый вопрос должен быть коротким и понятным
- Нумеруй вопросы (1., 2., 3. и т.д.)
- Вопросы должны быть закрытыми или с вариантами ответа для удобства
- Попроси ответить ТЕКСТОМ (не голосом) для удобства обработки

СТИЛЬ:
- Пиши как в обычной переписке: просто, по-человечески, на "ВЫ"
- Используй эмодзи умеренно (1-2 максимум)
- Тон: профессиональный, но дружелюбный и неформальный
- Объясни, что это первый этап - быстрые организационные вопросы
- Дай понять, что после этого будет более детальное обсуждение

ВАЖНО:
- Создай впечатление, что это пишет живой человек, а не бот
- Сделай процесс максимально простым и понятным
- Покажи уважение к времени кандидата`;
}
