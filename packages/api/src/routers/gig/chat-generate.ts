import type { botSettings } from "@qbs-autonaim/db/schema";
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
  quickReplies: z.array(z.string()).optional(),
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
  botSettings?: typeof botSettings | null,
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

  // Настройки компании для персонализации
  const companySection = botSettings
    ? `
НАСТРОЙКИ КОМПАНИИ:
Название компании: ${botSettings.companyName}
${botSettings.companyDescription ? `Описание компании: ${botSettings.companyDescription}` : ""}
${botSettings.companyWebsite ? `Сайт: ${botSettings.companyWebsite}` : ""}
${botSettings.botName ? `Имя бота-рекрутера: ${botSettings.botName}` : ""}
${botSettings.botRole ? `Роль бота: ${botSettings.botRole}` : ""}
`
    : "";

  // Detect project type for better context
  const fullContext =
    `${message} ${currentDocument?.title || ""} ${currentDocument?.description || ""}`.toLowerCase();
  let projectTypeHint = "";

  if (
    fullContext.includes("telegram") ||
    fullContext.includes("бот") ||
    fullContext.includes("bot")
  ) {
    projectTypeHint =
      "\nТИП ПРОЕКТА: Telegram-бот - предлагай специфичные для ботов функции (платежи, базы данных, API интеграции, админ-панель)";
  } else if (
    fullContext.includes("сайт") ||
    fullContext.includes("веб") ||
    fullContext.includes("web")
  ) {
    projectTypeHint =
      "\nТИП ПРОЕКТА: Веб-разработка - предлагай веб-специфичные функции (адаптивность, SEO, авторизация, CMS)";
  } else if (
    fullContext.includes("мобильн") ||
    fullContext.includes("приложен") ||
    fullContext.includes("app")
  ) {
    projectTypeHint =
      "\nТИП ПРОЕКТА: Мобильное приложение - предлагай мобильные функции (push-уведомления, офлайн режим, геолокация)";
  } else if (
    fullContext.includes("дизайн") ||
    fullContext.includes("ui") ||
    fullContext.includes("ux")
  ) {
    projectTypeHint =
      "\nТИП ПРОЕКТА: Дизайн - предлагай дизайнерские задачи (прототип, фирменный стиль, анимации)";
  }

  const botPersonality =
    botSettings?.botName && botSettings?.botRole
      ? `Ты — ${botSettings.botName}, ${botSettings.botRole} компании "${botSettings.companyName}".`
      : typeof botSettings?.companyName
        ? `Ты — эксперт по созданию технических заданий для компании "${botSettings.companyName}".`
        : "Ты — эксперт по созданию технических заданий для фрилансеров.";

  const companyContext = botSettings?.companyDescription
    ? `\n\nКОНТЕКСТ КОМПАНИИ: ${botSettings.companyDescription}\nУчитывай специфику и потребности этой компании при создании заданий.`
    : "";

  return `${botPersonality}

ЗАДАЧА: На основе сообщения пользователя обнови документ разового задания (gig).${projectTypeHint}${companyContext}
${companySection}${historySection}
НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ИНСТРУКЦИИ:
- Проанализируй сообщение пользователя и пойми, что он хочет добавить/изменить
- Определи тип проекта (Telegram-бот, веб-сайт, мобильное приложение, дизайн и т.д.)
- Учитывай специфику и потребности компании "${botSettings?.companyName || "клиента"}"
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

БЫСТРЫЕ ОТВЕТЫ (quickReplies):
- Предложи 2-4 варианта кнопок для следующего шага
- Кнопки должны быть короткими (2-5 слов)
- Кнопки должны быть КОНКРЕТНЫМИ и РЕЛЕВАНТНЫМИ для данного проекта
- Анализируй тип проекта и предлагай специфичные для него варианты
- Для Telegram-ботов: "Добавить платежи", "Настроить базу данных", "Интеграция с API"
- Для веб-разработки: "Адаптивный дизайн", "SEO оптимизация", "Система авторизации"
- Для мобильных приложений: "Push-уведомления", "Офлайн режим", "Интеграция с соцсетями"
- Для дизайна: "Создать прототип", "Фирменный стиль", "Анимации и переходы"
- Если документ почти готов, предложи варианты уточнений или "Всё готово"
- Избегай общих фраз типа "Добавить детали" - будь конкретным

ФОРМАТ ОТВЕТА (JSON):
{
  "title": "Название задания",
  "description": "Описание проекта и контекст",
  "deliverables": "Что нужно сделать (список результатов)",
  "requiredSkills": "Требуемые навыки и технологии",
  "budgetRange": "Бюджет (например: 5000-10000 руб)",
  "timeline": "Сроки выполнения (например: 3-5 дней)",
  "quickReplies": ["Вариант 1", "Вариант 2", "Вариант 3"]
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

    // Загружаем настройки компании для персонализации промпта
    const botSettings = await ctx.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) =>
        eq(botSettings.workspaceId, workspaceId),
    });

    const prompt = buildGigGenerationPrompt(
      message,
      currentDocument,
      conversationHistory,
      botSettings,
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

      console.log("[gig-chat-generate] AI response length:", fullText.length);

      const jsonString = extractJSON(fullText);
      if (!jsonString) {
        console.error(
          "[gig-chat-generate] No JSON found in response:",
          fullText.substring(0, 500),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI не вернул валидный JSON. Попробуйте переформулировать запрос.",
        });
      }

      console.log(
        "[gig-chat-generate] Extracted JSON:",
        jsonString.substring(0, 300),
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("[gig-chat-generate] JSON parse error:", parseError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось распарсить ответ от AI. Попробуйте ещё раз.",
        });
      }

      const validationResult = aiResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
        console.error(
          "[gig-chat-generate] Validation error:",
          validationResult.error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI вернул данные в неожиданном формате. Попробуйте ещё раз.",
        });
      }

      const validated = validationResult.data;

      const finalDocument = {
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
      };

      console.log("[gig-chat-generate] Validated document:", {
        hasTitle: !!validated.title,
        hasDescription: !!validated.description,
        hasDeliverables: !!validated.deliverables,
        quickRepliesCount: validated.quickReplies?.length ?? 0,
      });

      console.log(
        "[gig-chat-generate] Final document being returned:",
        finalDocument,
      );

      return {
        document: finalDocument,
        quickReplies: validated.quickReplies ?? [],
      };
    } catch (error) {
      console.error("[gig-chat-generate] Error:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось сгенерировать задание. Попробуйте позже.",
      });
    }
  });
