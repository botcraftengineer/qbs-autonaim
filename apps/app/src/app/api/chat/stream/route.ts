import { chatSession, db, eq, vacancy } from "@qbs-autonaim/db";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import {
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "~/auth/server";

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
  chatSessionId: z.string().optional(),
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
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, messages, chatSessionId } = requestBody;

    // Проверка доступа к chatSession
    let chatContext = "";
    if (chatSessionId) {
      const chat = await db.query.chatSession.findFirst({
        where: eq(chatSession.id, chatSessionId),
      });

      if (!chat) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Получаем контекст в зависимости от типа сущности
      if (chat.entityType === "vacancy") {
        const vac = await db.query.vacancy.findFirst({
          where: eq(vacancy.id, chat.entityId),
        });

        if (vac) {
          const workspaceId = vac.workspaceId;
          if (workspaceId) {
            const member = await db.query.workspaceMember.findFirst({
              where: (wm, { and }) =>
                and(
                  eq(wm.workspaceId, workspaceId),
                  eq(wm.userId, session.user.id),
                ),
            });

            if (!member) {
              return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
          }

          chatContext = `
Контекст вакансии:
- Название: ${vac.title || "Не указано"}
- Описание: ${vac.description || "Не указано"}
`;
        }
      }
    }

    // Формируем сообщения для AI
    const uiMessages = messages ?? (message ? [message] : []);

    const historyContext = uiMessages
      .map((m) => {
        const text = m.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n");
        return `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${text}`;
      })
      .join("\n\n");

    const prompt = `${chatContext}

История диалога:
${historyContext}

Ответь на последнее сообщение пользователя. Будь вежливым и профессиональным.`;

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
        console.error("Stream error:", error);
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
    console.error("Chat stream error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
