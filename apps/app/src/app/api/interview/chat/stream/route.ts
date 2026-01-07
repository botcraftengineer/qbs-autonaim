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

    const systemPrompt = `${conversationContext}

Ты — AI-интервьюер. Веди профессиональное интервью с кандидатом.
Будь вежливым, задавай уточняющие вопросы, оценивай ответы.`;

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
