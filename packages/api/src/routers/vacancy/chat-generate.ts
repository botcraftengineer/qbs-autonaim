import { generateText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const chatGenerateInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  message: z.string().min(1).max(2000),
  currentDocument: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.string().optional(),
      responsibilities: z.string().optional(),
      conditions: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

function buildVacancyGenerationPrompt(
  message: string,
  currentDocument?: {
    title?: string;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    conditions?: string;
  },
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
): string {
  const historySection = conversationHistory?.length
    ? `
ИСТОРИЯ ДИАЛОГА:
${conversationHistory
  .map(
    (msg) =>
      `${msg.role === "user" ? "Пользователь" : "Ассистент"}: ${msg.content}`,
  )
  .join("\n")}
`
    : "";

  const documentSection = currentDocument
    ? `
ТЕКУЩИЙ ДОКУМЕНТ ВАКАНСИИ:
${currentDocument.title ? `Название: ${currentDocument.title}` : ""}
${currentDocument.description ? `Описание: ${currentDocument.description}` : ""}
${currentDocument.requirements ? `Требования:\n${currentDocument.requirements}` : ""}
${currentDocument.responsibilities ? `Обязанности:\n${currentDocument.responsibilities}` : ""}
${currentDocument.conditions ? `Условия:\n${currentDocument.conditions}` : ""}
`
    : "ТЕКУЩИЙ ДОКУМЕНТ: (пусто)";

  return `Ты — эксперт по подбору персонала и созданию вакансий.

ЗАДАЧА: На основе сообщения пользователя обнови документ вакансии.
${historySection}
НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ИНСТРУКЦИИ:
- Проанализируй сообщение пользователя и пойми, что он хочет добавить/изменить
- Обнови соответствующие разделы документа
- Если пользователь указывает название должности - обнови title
- Если описывает компанию/проект - обнови description
- Если перечисляет требования к кандидату - обнови requirements
- Если описывает обязанности - обнови responsibilities
- Если говорит о зарплате/условиях - обнови conditions
- Сохрани существующую информацию, если пользователь не просит её изменить
- Используй профессиональный язык
- Структурируй списки с помощью маркеров или нумерации

ФОРМАТ ОТВЕТА (JSON):
{
  "title": "Название должности",
  "description": "Описание компании и проекта",
  "requirements": "Требования к кандидату (список)",
  "responsibilities": "Обязанности (список)",
  "conditions": "Условия работы и зарплата"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON без дополнительных пояснений.`;
}

export const chatGenerate = protectedProcedure
  .input(chatGenerateInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, message, currentDocument, conversationHistory } =
      input;

    const access = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const prompt = buildVacancyGenerationPrompt(
      message,
      currentDocument,
      conversationHistory,
    );

    try {
      const { text } = await generateText({
        prompt,
        generationName: "vacancy-chat-generation",
        entityId: workspaceId,
        metadata: {
          workspaceId,
          userId: ctx.session.user.id,
        },
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response from AI");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        document: {
          title: parsed.title || currentDocument?.title || "",
          description: parsed.description || currentDocument?.description || "",
          requirements:
            parsed.requirements || currentDocument?.requirements || "",
          responsibilities:
            parsed.responsibilities || currentDocument?.responsibilities || "",
          conditions: parsed.conditions || currentDocument?.conditions || "",
        },
      };
    } catch (error) {
      console.error("Error generating vacancy:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось сгенерировать вакансию. Попробуйте позже.",
      });
    }
  });
