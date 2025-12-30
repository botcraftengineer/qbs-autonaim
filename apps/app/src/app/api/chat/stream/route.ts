import { conversation, db, eq } from "@qbs-autonaim/db";
import { streamText } from "@qbs-autonaim/lib/ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1),
  chatId: z.string().optional(),
  conversationId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .optional(),
});

export const maxDuration = 60;

/**
 * API route для streaming AI чата
 * Адаптирован из ai-chatbot /api/chat/route.ts
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = requestSchema.parse(json);

    const { message, conversationId, messages = [] } = body;

    // Формируем контекст из истории сообщений
    const historyContext = messages
      .map(
        (m) =>
          `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`,
      )
      .join("\n\n");

    // Получаем контекст разговора если есть conversationId
    let conversationContext = "";
    if (conversationId) {
      const conv = await db.query.conversation.findFirst({
        where: eq(conversation.id, conversationId),
        with: {
          response: {
            with: {
              vacancy: true,
            },
          },
        },
      });

      if (conv?.response?.vacancy) {
        const vacancy = conv.response.vacancy;
        conversationContext = `
Контекст вакансии:
- Название: ${vacancy.title || "Не указано"}
- Описание: ${vacancy.description || "Не указано"}
`;
      }
    }

    // Формируем промпт
    const prompt = `${conversationContext}

История диалога:
${historyContext}

Пользователь: ${message}

Ответь на сообщение пользователя. Будь вежливым и профессиональным.`;

    // Запускаем streaming
    const result = streamText({
      prompt,
      generationName: "ai-chat-stream",
      entityId: conversationId,
      metadata: {
        conversationId,
        messageCount: messages.length,
      },
    });

    // Создаём SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = JSON.stringify({ type: "text-delta", data: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(
            encoder.encode(`data: {"type":"done","data":null}\n\n`),
          );
          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const data = JSON.stringify({ type: "error", data: errorMessage });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Chat stream error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
