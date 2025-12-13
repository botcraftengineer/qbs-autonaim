import { workspaceRepository } from "@qbs-autonaim/db";
import { generateText } from "@qbs-autonaim/lib";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const improveInstructionsInputSchema = z.object({
  vacancyId: z.string(),
  workspaceId: workspaceIdSchema,
  fieldType: z.enum([
    "customBotInstructions",
    "customScreeningPrompt",
    "customInterviewQuestions",
    "customOrganizationalQuestions",
  ]),
  currentValue: z.string(),
  vacancyTitle: z.string().optional(),
  vacancyDescription: z.string().optional(),
});

const FIELD_PROMPTS = {
  customBotInstructions: {
    title: "Общие инструкции для бота",
    description:
      "Инструкции для AI-бота, который будет общаться с кандидатами в Telegram",
    guidelines: `
- Укажи конкретные навыки и опыт, на которые нужно обратить внимание
- Добавь рекомендации по тону общения (формальный/неформальный)
- Укажи, какие вопросы важно задать для уточнения
- Добавь критерии, по которым оценивать ответы кандидата
- Сделай инструкции структурированными и понятными`,
  },
  customScreeningPrompt: {
    title: "Инструкции для скрининга резюме",
    description:
      "Критерии для автоматической оценки резюме кандидатов с помощью AI",
    guidelines: `
- Укажи ключевые навыки и технологии, которые должны быть в резюме
- Добавь минимальные требования к опыту работы
- Укажи, какие достижения или проекты будут плюсом
- Добавь критерии оценки (что важнее, что менее важно)
- Сделай критерии измеримыми и конкретными`,
  },
  customInterviewQuestions: {
    title: "Вопросы для интервью",
    description: "Список вопросов для проведения интервью с кандидатами",
    guidelines: `
- Создай структурированный список вопросов (каждый с новой строки)
- Добавь вопросы о техническом опыте и навыках
- Включи поведенческие вопросы (STAR-метод)
- Добавь вопросы о мотивации и карьерных целях
- Сделай вопросы открытыми, чтобы кандидат мог развернуто ответить`,
  },
  customOrganizationalQuestions: {
    title: "Организационные вопросы",
    description:
      "Вопросы о логистике, сроках и организационных моментах работы",
    guidelines: `
- Создай список вопросов о доступности и сроках (каждый с новой строки)
- Добавь вопросы о формате работы (офис/удаленка/гибрид)
- Включи вопросы о зарплатных ожиданиях
- Добавь вопросы о готовности к релокации (если актуально)
- Уточни наличие других офферов и сроки принятия решения`,
  },
};

function buildImprovementPrompt(
  fieldType: keyof typeof FIELD_PROMPTS,
  currentValue: string,
  vacancyTitle?: string,
  vacancyDescription?: string,
): string {
  const field = FIELD_PROMPTS[fieldType];

  const contextSection = vacancyTitle
    ? `
КОНТЕКСТ ВАКАНСИИ:
Название: ${vacancyTitle}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}
`
    : "";

  return `Ты — эксперт по подбору персонала и созданию эффективных инструкций для AI-ботов.

ЗАДАЧА: Улучши следующий текст для поля "${field.title}".
Назначение: ${field.description}
${contextSection}
ТЕКУЩИЙ ТЕКСТ:
${currentValue || "(пусто)"}

РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:
${field.guidelines}

ТРЕБОВАНИЯ:
- Сохрани основную идею и намерение автора
- Сделай текст более структурированным и понятным
- Добавь конкретики и измеримых критериев
- Убери размытые формулировки
- Используй профессиональный, но понятный язык
- Для списков вопросов: каждый вопрос с новой строки, нумерованный
- Максимум 5000 символов

ВАЖНО: Верни ТОЛЬКО улучшенный текст, без пояснений, комментариев или вводных фраз.`;
}

export const improveInstructions = protectedProcedure
  .input(improveInstructionsInputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      vacancyId,
      workspaceId,
      fieldType,
      currentValue,
      vacancyTitle,
      vacancyDescription,
    } = input;

    const access = await workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    if (!currentValue?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Невозможно улучшить пустой текст",
      });
    }

    const prompt = buildImprovementPrompt(
      fieldType,
      currentValue,
      vacancyTitle,
      vacancyDescription,
    );

    try {
      const { text } = await generateText({
        prompt,
        generationName: "improve-vacancy-instructions",
        entityId: vacancyId,
        metadata: {
          workspaceId,
          fieldType,
          userId: ctx.session.user.id,
        },
      });

      return {
        improvedText: text.trim(),
      };
    } catch (error) {
      console.error("Error improving instructions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось улучшить текст. Попробуйте позже.",
      });
    }
  });
