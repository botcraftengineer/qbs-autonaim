import { streamText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

// Схема для валидации ответа от AI
const aiResponseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  conditions: z.string().optional(),
});

/**
 * Безопасно извлекает первый валидный JSON объект из текста
 * Использует балансировку скобок для поиска корректного JSON
 */
function extractJSON(text: string): string | null {
  const startIndex = text.indexOf("{");
  if (startIndex === -1) return null;

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        return text.substring(startIndex, i + 1);
      }
    }
  }

  return null;
}

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
      const result = await streamText({
        prompt,
        generationName: "vacancy-chat-generation",
        entityId: workspaceId,
        metadata: {
          workspaceId,
          userId: ctx.session.user.id,
        },
      });

      // Собираем весь текст из стрима
      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      // Безопасно извлекаем JSON
      const jsonString = extractJSON(fullText);
      if (!jsonString) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI не вернул валидный JSON. Попробуйте переформулировать запрос.",
        });
      }

      // Парсим JSON с обработкой ошибок
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch (error) {
        console.error("JSON parse error:", error, "Raw JSON:", jsonString);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось распарсить ответ от AI. Попробуйте ещё раз.",
        });
      }

      // Валидируем структуру через Zod
      const validationResult = aiResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
        console.error(
          "Validation error:",
          validationResult.error,
          "Parsed data:",
          parsed,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI вернул данные в неожиданном формате. Попробуйте ещё раз.",
        });
      }

      const validated = validationResult.data;

      return {
        document: {
          title: validated.title ?? currentDocument?.title ?? "",
          description:
            validated.description ?? currentDocument?.description ?? "",
          requirements:
            validated.requirements ?? currentDocument?.requirements ?? "",
          responsibilities:
            validated.responsibilities ??
            currentDocument?.responsibilities ??
            "",
          conditions: validated.conditions ?? currentDocument?.conditions ?? "",
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
