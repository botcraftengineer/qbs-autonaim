import { streamText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const aiResponseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
});

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
      deliverables: z.string().optional(),
      requiredSkills: z.string().optional(),
      budgetRange: z.string().optional(),
      timeline: z.string().optional(),
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

function buildGigGenerationPrompt(
  message: string,
  currentDocument?: {
    title?: string;
    description?: string;
    deliverables?: string;
    requiredSkills?: string;
    budgetRange?: string;
    timeline?: string;
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
ТЕКУЩИЙ ДОКУМЕНТ ЗАДАНИЯ:
${currentDocument.title ? `Название: ${currentDocument.title}` : ""}
${currentDocument.description ? `Описание: ${currentDocument.description}` : ""}
${currentDocument.deliverables ? `Что нужно сделать:\n${currentDocument.deliverables}` : ""}
${currentDocument.requiredSkills ? `Требуемые навыки:\n${currentDocument.requiredSkills}` : ""}
${currentDocument.budgetRange ? `Бюджет: ${currentDocument.budgetRange}` : ""}
${currentDocument.timeline ? `Сроки: ${currentDocument.timeline}` : ""}
`
    : "ТЕКУЩИЙ ДОКУМЕНТ: (пусто)";

  return `Ты — эксперт по созданию технических заданий для фрилансеров.

ЗАДАЧА: На основе сообщения пользователя обнови документ разового задания (gig).
${historySection}
НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ИНСТРУКЦИИ:
- Проанализируй сообщение пользователя и пойми, что он хочет добавить/изменить
- Обнови соответствующие разделы документа
- Если пользователь указывает название задачи - обнови title
- Если описывает проект/задачу - обнови description
- Если перечисляет что нужно сделать - обнови deliverables
- Если описывает требуемые навыки - обнови requiredSkills
- Если говорит о бюджете - обнови budgetRange
- Если говорит о сроках - обнови timeline
- Сохрани существующую информацию, если пользователь не просит её изменить
- Используй чёткий, понятный язык
- Структурируй списки с помощью маркеров или нумерации

ФОРМАТ ОТВЕТА (JSON):
{
  "title": "Название задания",
  "description": "Описание проекта и контекст",
  "deliverables": "Что нужно сделать (список результатов)",
  "requiredSkills": "Требуемые навыки и технологии",
  "budgetRange": "Бюджет (например: 5000-10000 руб)",
  "timeline": "Сроки выполнения (например: 3-5 дней)"
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

    const prompt = buildGigGenerationPrompt(
      message,
      currentDocument,
      conversationHistory,
    );

    try {
      const result = await streamText({
        prompt,
        generationName: "gig-chat-generation",
        entityId: workspaceId,
        metadata: {
          workspaceId,
          userId: ctx.session.user.id,
        },
      });

      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      const jsonString = extractJSON(fullText);
      if (!jsonString) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI не вернул валидный JSON. Попробуйте переформулировать запрос.",
        });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось распарсить ответ от AI. Попробуйте ещё раз.",
        });
      }

      const validationResult = aiResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
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
          deliverables:
            validated.deliverables ?? currentDocument?.deliverables ?? "",
          requiredSkills:
            validated.requiredSkills ?? currentDocument?.requiredSkills ?? "",
          budgetRange:
            validated.budgetRange ?? currentDocument?.budgetRange ?? "",
          timeline: validated.timeline ?? currentDocument?.timeline ?? "",
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось сгенерировать задание. Попробуйте позже.",
      });
    }
  });
