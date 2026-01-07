/**
 * Публичный endpoint для AI-чата интервью
 * Доступен без авторизации, но защищён проверкой conversationId
 * Только для WEB интервью (source = 'WEB')
 */
import { db, eq } from "@qbs-autonaim/db";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import {
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(10000),
});

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(textPartSchema),
});

const requestSchema = z.object({
  id: z.uuid().optional(),
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  conversationId: z.string(),
});

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const { message, messages, conversationId } = requestBody;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }

    // Проверяем что conversation существует и это WEB интервью
    const conv = await db.query.conversation.findFirst({
      where: (c, { and }) => and(eq(c.id, conversationId), eq(c.source, "WEB")),
      with: {
        response: {
          with: {
            vacancy: true,
          },
        },
      },
    });

    if (!conv) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    // Проверяем что интервью активно
    if (conv.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Interview is not active" },
        { status: 403 },
      );
    }

    // Формируем контекст вакансии
    let conversationContext = "";
    if (conv.response?.vacancy) {
      const vac = conv.response.vacancy;
      conversationContext = `
Контекст вакансии:
- Название: ${vac.title || "Не указано"}
- Описание: ${vac.description || "Не указано"}
`;
    }

    // Формируем сообщения для AI
    const uiMessages = messages ?? (message ? [message] : []);

    const historyContext = uiMessages
      .map((m) => {
        const text = m.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n");
        return `${m.role === "user" ? "Кандидат" : "Интервьюер"}: ${text}`;
      })
      .join("\n\n");

    const prompt = `${conversationContext}

История диалога:
${historyContext}

Ты — AI-интервьюер. Ответь на последнее сообщение кандидата. Будь вежливым и профессиональным.`;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          model: getAIModel(),
          prompt,
          experimental_transform: smoothStream({ chunking: "word" }),
        });

        result.consumeStream();

        writer.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onError: (error) => {
        console.error("Interview stream error:", error);
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
    console.error("Interview chat stream error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
