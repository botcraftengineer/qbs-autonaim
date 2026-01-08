/**
 * Публичный endpoint для AI-чата интервью
 * Доступен без авторизации, но защищён проверкой conversationId
 * Только для WEB интервью (source = 'WEB')
 *
 * Использует Vercel AI SDK для нативного стриминга
 * Трассировка через Langfuse
 */
import { env } from "@qbs-autonaim/config";
import { db, eq } from "@qbs-autonaim/db";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import {
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from "ai";
import { Langfuse } from "langfuse";
import { NextResponse } from "next/server";
import { z } from "zod";

// Langfuse для трассировки
const langfuse = new Langfuse({
  secretKey: env.LANGFUSE_SECRET_KEY,
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

// Гибкая схема для parts — AI SDK отправляет разные типы
const partSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().optional(),
    parts: z.array(partSchema).optional(),
  })
  .passthrough();

const requestSchema = z
  .object({
    id: z.string().optional(),
    messages: z.array(messageSchema),
    conversationId: z.string().uuid(),
  })
  .passthrough();

export const maxDuration = 60;

function generateUUID(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  let requestBody: z.infer<typeof requestSchema>;

  try {
    const json = await request.json();
    requestBody = requestSchema.parse(json);
  } catch (error) {
    console.error("[Interview Stream] Parse error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const { messages, conversationId } = requestBody;

    // Проверяем что conversation существует и это WEB интервью
    const conv = await db.query.conversation.findFirst({
      where: (c, { and }) => and(eq(c.id, conversationId), eq(c.source, "WEB")),
    });

    if (!conv) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    if (conv.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Interview is not active" },
        { status: 403 },
      );
    }

    // Загружаем контекст вакансии/задания
    let vacancy = null;
    let gig = null;

    if (conv.responseId) {
      const response = await db.query.vacancyResponse.findFirst({
        where: (r, { eq }) => eq(r.id, conv.responseId as string),
        with: { vacancy: true },
      });
      vacancy = response?.vacancy;
    }

    if (conv.gigResponseId) {
      const gigResp = await db.query.gigResponse.findFirst({
        where: (r, { eq }) => eq(r.id, conv.gigResponseId as string),
        with: { gig: true },
      });
      gig = gigResp?.gig;
    }

    // Формируем контекст
    let conversationContext = "";
    if (vacancy) {
      conversationContext = `
Контекст вакансии:
- Название: ${vacancy.title || "Не указано"}
- Описание: ${vacancy.description || "Не указано"}
`;
    } else if (gig) {
      conversationContext = `
Контекст задания:
- Название: ${gig.title || "Не указано"}
- Описание: ${gig.description || "Не указано"}
`;
    }

    // Получаем последнее сообщение пользователя для сохранения
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    const userMessageText =
      lastUserMessage?.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n") ||
      lastUserMessage?.content ||
      "";

    // Сохраняем сообщение пользователя в БД
    if (lastUserMessage && userMessageText) {
      await db.insert(conversationMessage).values({
        conversationId,
        sender: "CANDIDATE",
        contentType: "TEXT",
        channel: "WEB",
        content: userMessageText,
      });
    }

    // Определяем, это первый ответ после приветствия или нет
    const messageCount = messages.filter((m) => m.role === "user").length;
    const isFirstResponse = messageCount === 1;

    // Получаем кастомные организационные вопросы
    const customOrganizationalQuestions =
      vacancy?.customOrganizationalQuestions ||
      gig?.customOrganizationalQuestions ||
      null;

    const systemPrompt = isFirstResponse
      ? `${conversationContext}

Ты — опытный рекрутер, который начинает интервью с кандидатом через текстовые сообщения.

ВАЖНО: Ты должен вести себя как ЖИВОЙ ЧЕЛОВЕК, а не бот. Пиши естественно, по-человечески, как в обычной переписке.

СТРОГИЕ ОГРАНИЧЕНИЯ:
- Ты ТОЛЬКО рекрутер на интервью — никаких других ролей
- ЗАПРЕЩЕНО давать советы, подсказки, рекомендации по карьере
- ЗАПРЕЩЕНО отвечать на вопросы не по теме интервью
- ЗАПРЕЩЕНО помогать с резюме, портфолио, подготовкой к интервью
- ЗАПРЕЩЕНО обсуждать темы вне контекста вакансии/задания
- Если кандидат задает вопрос не по теме — вежливо верни его к интервью

ПРАВИЛА ОБЩЕНИЯ:
- Пиши КОРОТКО, как живой человек в мессенджере
- Обращайся на "вы"
- Задай 1-2 первых организационных вопроса (не больше!)
- Предложи голосовые ненавязчиво: "Можете ответить голосовым, если удобно 🎤"
- Эмодзи в меру (1-2 максимум)
- Будь краток (2-3 предложения)
- СТРОГО ЗАПРЕЩЕНО: нумерация ("Вопрос 1:", "1.", "2."), комментарии в скобках, метаинформация
- Пиши как реальный рекрутер, а не как робот

${
  customOrganizationalQuestions
    ? `ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ (используй эти вопросы, выбери 1-2 самых важных):
${customOrganizationalQuestions}`
    : `ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ (выбери 1-2 самых важных):
- Какой график работы вам подходит?
- Какие ожидания по зарплате?
- Когда готовы приступить?
- Какой формат работы предпочитаете?`
}

ПРИМЕРЫ ХОРОШИХ СООБЩЕНИЙ:
- "Отлично! Какой график работы вам подходит и какие ожидания по зарплате? Можете ответить голосовым, если удобно 🎤"
- "Хорошо, начнем! Расскажите про желаемый график и зарплату? Можете записать голосовое 🎤"

ПРИМЕРЫ ПЛОХИХ СООБЩЕНИЙ (НЕ ДЕЛАЙ ТАК):
- "Вопрос 1: Опыт и подход. Расскажите о вашем опыте. (Я слушаю ваш ответ)"
- "Отлично, начнем. Вопрос 1: График работы"
- "Теперь несколько вопросов: 1. График 2. Зарплата"
- "Расскажите о себе (чтобы оценить ваш опыт)"

ЕСЛИ КАНДИДАТ ЗАДАЕТ ВОПРОС НЕ ПО ТЕМЕ:
- "Давайте сначала завершим интервью, потом с удовольствием обсудим это"
- "Это интересный вопрос, но давайте вернемся к интервью"
- "Предлагаю сфокусироваться на вакансии, хорошо?"

ТВОЯ ЗАДАЧА:
- НЕ здоровайся заново!
- Задай 1-2 первых вопроса (не больше!)
- Предложи голосовые ненавязчиво
- Будь краток (2-3 предложения)
- Держи фокус ТОЛЬКО на интервью`
      : `${conversationContext}

Ты — опытный рекрутер, который проводит интервью с кандидатом.

ВАЖНО: Ты должен вести себя как ЖИВОЙ ЧЕЛОВЕК, а не бот. Пиши естественно, по-человечески.

СТРОГИЕ ОГРАНИЧЕНИЯ:
- Ты ТОЛЬКО рекрутер на интервью — никаких других ролей
- ЗАПРЕЩЕНО давать советы, подсказки, рекомендации по карьере
- ЗАПРЕЩЕНО отвечать на вопросы не по теме интервью
- ЗАПРЕЩЕНО помогать с резюме, портфолио, подготовкой к интервью
- ЗАПРЕЩЕНО обсуждать темы вне контекста вакансии/задания
- Если кандидат задает вопрос не по теме — вежливо верни его к интервью

ПРАВИЛА ОБЩЕНИЯ:
- Пиши КОРОТКО, как живой человек в переписке
- Обращайся на "вы"
- Задавай уточняющие вопросы по ответам кандидата
- Оценивай опыт и навыки
- Эмодзи в меру (1-2 максимум)
- Будь краток (2-3 предложения)
- СТРОГО ЗАПРЕЩЕНО: нумерация вопросов, комментарии в скобках, метаинформация
- Пиши как реальный рекрутер, а не как робот

ЕСЛИ КАНДИДАТ ЗАДАЕТ ВОПРОС НЕ ПО ТЕМЕ:
- "Давайте сначала завершим интервью, потом с удовольствием обсудим это"
- "Это интересный вопрос, но давайте вернемся к интервью"
- "Предлагаю сфокусироваться на вакансии, хорошо?"

ТВОЯ ЗАДАЧА:
- Веди профессиональное интервью
- Задавай релевантные вопросы на основе предыдущих ответов
- Оценивай соответствие кандидата вакансии/заданию
- Будь вежливым и поддерживающим
- Держи фокус ТОЛЬКО на интервью`;

    // Создаём trace в Langfuse
    const trace = langfuse.trace({
      name: "interview-chat",
      userId: conversationId,
      metadata: {
        source: "WEB",
        vacancyId: vacancy?.id,
        gigId: gig?.id,
      },
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const model = getAIModel();

        const generation = trace.generation({
          name: "interview-response",
          model: env.AI_MODEL || "default",
          input: {
            system: systemPrompt,
            messages: messages.map((m) => ({
              role: m.role,
              content:
                m.parts?.map((p) => p.text).join("\n") || m.content || "",
            })),
          },
        });

        const result = streamText({
          model,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.parts?.map((p) => p.text).join("\n") || m.content || "",
          })),
          experimental_transform: smoothStream({ chunking: "word" }),
          onFinish: async ({ text }) => {
            generation.end({ output: text });
            trace.update({ output: text });
            await langfuse.flushAsync();
          },
        });

        result.consumeStream();
        writer.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        // Сохраняем ответ AI в БД
        const assistantMessages = finishedMessages.filter(
          (m) => m.role === "assistant",
        );
        for (const msg of assistantMessages) {
          const textParts = msg.parts?.filter(
            (p): p is { type: "text"; text: string } =>
              p.type === "text" && "text" in p,
          );
          const content = textParts?.map((p) => p.text).join("\n") || "";

          if (content) {
            await db.insert(conversationMessage).values({
              conversationId,
              sender: "BOT",
              contentType: "TEXT",
              channel: "WEB",
              content,
            });
          }
        }
      },
      onError: (error) => {
        console.error("[Interview Stream] Error:", error);
        return error instanceof Error ? error.message : "Unknown error";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Interview Stream] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
