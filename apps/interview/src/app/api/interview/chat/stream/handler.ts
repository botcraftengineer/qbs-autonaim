/**
 * Публичный endpoint для AI-чата интервью
 * Доступен без авторизации, но защищён проверкой interviewSessionId
 * Только для WEB интервью (lastChannel = 'web')
 *
 * Использует мультиагентную систему с поддержкой стриминга
 * Трассировка через Langfuse
 */

import { WebInterviewOrchestrator } from "@qbs-autonaim/ai";
import { env } from "@qbs-autonaim/config";
import { db, eq } from "@qbs-autonaim/db";
import {
  gig as gigTable,
  interviewMessage,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
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
import { createWebInterviewRuntime } from "./interview-runtime";

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
    sessionId: z.string().uuid(),
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
    const { messages, sessionId } = requestBody;

    // Проверяем что interview session существует и это WEB интервью
    const session = await db.query.interviewSession.findFirst({
      where: (s, { and }) => and(eq(s.id, sessionId), eq(s.lastChannel, "web")),
      with: {
        messages: {
          with: {
            file: true,
          },
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Interview is not active" },
        { status: 403 },
      );
    }

    // Загружаем контекст вакансии/задания
    let vacancy = null;
    let gig = null;
    let companySettings = null;

    const responseRecord = await db.query.response.findFirst({
      where: eq(responseTable.id, session.responseId),
    });

    if (!responseRecord) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 },
      );
    }

    if (responseRecord.entityType === "vacancy") {
      vacancy = await db.query.vacancy.findFirst({
        where: eq(vacancyTable.id, responseRecord.entityId),
        with: {
          workspace: {
            with: {
              botSettings: true,
            },
          },
        },
      });

      const bot = vacancy?.workspace?.botSettings;
      companySettings = bot
        ? {
            botName: bot.botName,
            botRole: bot.botRole,
            name: bot.companyName,
          }
        : null;
    }

    if (responseRecord.entityType === "gig") {
      gig = await db.query.gig.findFirst({
        where: eq(gigTable.id, responseRecord.entityId),
        with: {
          workspace: {
            with: {
              botSettings: true,
            },
          },
        },
      });

      const bot = gig?.workspace?.botSettings;
      companySettings = bot
        ? {
            botName: bot.botName,
            botRole: bot.botRole,
            name: bot.companyName,
          }
        : null;
    }

    // Получаем последнее сообщение пользователя
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    const userMessageText =
      lastUserMessage?.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n") ||
      lastUserMessage?.content ||
      "";

    // Сохраняем текстовое сообщение пользователя в БД
    if (lastUserMessage && userMessageText) {
      const hasVoiceFile = lastUserMessage.parts?.some(
        (p) => p.type === "file",
      );
      if (!hasVoiceFile) {
        await db.insert(interviewMessage).values({
          sessionId,
          role: "user",
          type: "text",
          channel: "web",
          content: userMessageText,
        });
      }
    }

    // Создаём trace в Langfuse (раньше, чтобы связать все запросы)
    const trace = langfuse.trace({
      name: "web-interview-chat",
      userId: sessionId,
      metadata: {
        source: "WEB",
        vacancyId: vacancy?.id,
        gigId: gig?.id,
      },
    });

    // Создаём оркестратор
    const model = getAIModel();
    const orchestrator = new WebInterviewOrchestrator({ model, langfuse });
    orchestrator.setTraceId(trace.id);

    // Формируем историю диалога для оркестратора
    const conversationHistory = session.messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        sender: (msg.role === "user" ? "CANDIDATE" : "BOT") as
          | "CANDIDATE"
          | "BOT",
        content: msg.content ?? "",
      }));

    // Добавляем текущее сообщение в историю
    if (userMessageText) {
      conversationHistory.push({
        sender: "CANDIDATE",
        content: userMessageText,
      });
    }

    // Определяем, это первый ответ после приветствия
    const messageCount = messages.filter((m) => m.role === "user").length;
    const isFirstResponse = messageCount === 1;

    // Анализируем контекст сообщения (для эскалации и типа)
    const contextAnalysis = await orchestrator.analyzeContext(
      userMessageText,
      conversationHistory,
    );

    // Если нужна эскалация — возвращаем специальный ответ
    if (contextAnalysis.shouldEscalate) {
      console.warn("[Interview Stream] Escalation triggered:", {
        conversationId: sessionId,
        reason: contextAnalysis.escalationReason,
      });
      // TODO: можно добавить логику эскалации
    }

    // Если простое подтверждение — не отвечаем
    if (
      contextAnalysis.messageType === "ACKNOWLEDGMENT" &&
      !contextAnalysis.requiresResponse
    ) {
      return NextResponse.json({ acknowledged: true });
    }

    // Формируем контекст для оркестратора
    const interviewContext = {
      conversationId: sessionId,
      candidateName:
        (session.metadata as { candidateName?: string })?.candidateName || null,
      vacancyTitle: vacancy?.title || gig?.title || null,
      vacancyDescription: vacancy?.description || gig?.description || null,
      conversationHistory,
      botSettings: companySettings
        ? {
            botName: companySettings.botName || undefined,
            botRole: companySettings.botRole || undefined,
            companyName: companySettings.name,
          }
        : undefined,
    };

    const { tools, systemPrompt } = createWebInterviewRuntime({
      model,
      sessionId,
      gig,
      vacancy,
      interviewContext,
      isFirstResponse,
    });

    // Обновляем trace с дополнительной информацией
    trace.update({
      metadata: {
        source: "WEB",
        vacancyId: vacancy?.id,
        gigId: gig?.id,
        messageType: contextAnalysis.messageType,
        isFirstResponse,
      },
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const generation = trace.generation({
          name: "interview-response",
          model: env.AI_MODEL || "default",
          input: {
            system: systemPrompt,
            userMessage: userMessageText,
            contextAnalysis,
          },
        });

        // Формируем сообщения для AI
        const formattedMessages = messages.map((m) => {
          let content =
            m.parts?.map((p) => p.text).join("\n") || m.content || "";

          if (m.role === "user") {
            const hasVoiceFile = m.parts?.some((p) => p.type === "file");
            if (hasVoiceFile) {
              content = `[Голосовое сообщение]\n${content}`;
            }
          }

          return {
            role: m.role as "user" | "assistant" | "system",
            content,
          };
        });

        const result = streamText({
          model,
          system: systemPrompt,
          messages: formattedMessages,
          tools,
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
            await db.insert(interviewMessage).values({
              sessionId,
              role: "assistant",
              type: "text",
              channel: "web",
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
