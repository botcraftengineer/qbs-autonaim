/**
 * Публичный endpoint для AI-чата интервью
 * Доступен без авторизации, но защищён проверкой interviewSessionId
 * Только для WEB интервью (lastChannel = 'web')
 *
 * Использует мультиагентную систему с поддержкой стриминга
 * Трассировка через Langfuse
 */

import { observe, updateActiveTrace } from "@langfuse/tracing";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { WebInterviewOrchestrator } from "@qbs-autonaim/ai";
import { hasInterviewAccess, validateInterviewToken } from "@qbs-autonaim/api";
import { db, eq } from "@qbs-autonaim/db";
import {
  gig as gigTable,
  interviewMessage,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { getAIModel, getFallbackModel } from "@qbs-autonaim/lib/ai";
import "@qbs-autonaim/lib/instrumentation";
import {
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createWebInterviewRuntime } from "./interview-runtime";

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
    interviewToken: z.string().nullable().optional(),
  })
  .passthrough();

export const maxDuration = 60;

function generateUUID(): string {
  return crypto.randomUUID();
}

async function handler(request: Request) {
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
    const { messages, sessionId, interviewToken } = requestBody;

    let validatedToken = null;
    if (interviewToken) {
      try {
        validatedToken = await validateInterviewToken(interviewToken, db);
      } catch (error) {
        console.error(
          "[Interview Stream] Failed to validate interview token:",
          error,
        );
      }
    }

    const accessAllowed = await hasInterviewAccess(
      sessionId,
      validatedToken,
      null,
      db,
    );

    if (!accessAllowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

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
      vacancy =
        (await db.query.vacancy.findFirst({
          where: eq(vacancyTable.id, responseRecord.entityId),
          with: {
            workspace: {
              with: {
                botSettings: true,
              },
            },
          },
        })) ?? null;

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
      gig =
        (await db.query.gig.findFirst({
          where: eq(gigTable.id, responseRecord.entityId),
          with: {
            workspace: {
              with: {
                botSettings: true,
              },
            },
          },
        })) ?? null;

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

    // Устанавливаем метаданные для активного trace
    updateActiveTrace({
      name: "web-interview-chat",
      userId: sessionId,
      sessionId: sessionId,
      metadata: {
        source: "WEB",
        vacancyId: vacancy?.id,
        gigId: gig?.id,
      },
    });

    // Создаём оркестратор
    const model = getAIModel();
    const orchestrator = new WebInterviewOrchestrator({ model });

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
    const existingUserMessageCount = session.messages.filter(
      (m) => m.role === "user",
    ).length;
    const isFirstResponse = existingUserMessageCount === 0;

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
      db,
      gig: gig ?? null,
      vacancy: vacancy ?? null,
      interviewContext,
      isFirstResponse,
    });

    // Метаданные уже установлены в updateActiveTrace выше

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const formattedMessages: Array<{
          role: "user" | "assistant";
          content: string;
        }> = session.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => {
            const baseText =
              m.type === "voice"
                ? (m.voiceTranscription ?? m.content ?? "")
                : (m.content ?? "");

            const content =
              m.type === "voice"
                ? `[Голосовое сообщение]\n${baseText}`
                : baseText;

            return {
              role: m.role as "user" | "assistant",
              content,
            };
          });

        if (userMessageText) {
          const last = formattedMessages.at(-1);
          if (last?.role !== "user" || last.content !== userMessageText) {
            formattedMessages.push({ role: "user", content: userMessageText });
          }
        }

        // biome-ignore lint/suspicious/noExplicitAny: Complex generic types cause compatibility issues with tool inference
        let result: any;

        try {
          result = streamText({
            model,
            system: systemPrompt,
            messages: formattedMessages,
            tools,
            stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calls and final response
            experimental_transform: smoothStream({ chunking: "word" }),
            experimental_telemetry: { isEnabled: true }, // Enable Langfuse telemetry for tool calls
            onFinish: async () => {
              // End span manually after stream has finished
              trace.getActiveSpan()?.end();
            },
          });
        } catch (error) {
          console.warn(
            "[Interview Stream] Ошибка с основной моделью, пробую fallback:",
            error,
          );

          try {
            const fallbackModel = getFallbackModel();

            // Добавляем информацию о fallback в метаданные trace

            result = streamText({
              model: fallbackModel,
              system: systemPrompt,
              messages: formattedMessages,
              tools,
              stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calls and final response
              experimental_transform: smoothStream({ chunking: "word" }),
              experimental_telemetry: { isEnabled: true }, // Enable Langfuse telemetry for tool calls
              onFinish: async () => {
                // End span manually after stream has finished
                trace.getActiveSpan()?.end();
              },
            });

            console.log(
              "[Interview Stream] Успешно переключился на fallback модель",
            );
          } catch (fallbackError) {
            console.error(
              "[Interview Stream] Fallback модель также недоступна:",
              fallbackError,
            );
            // End span with error
            trace.getActiveSpan()?.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Основная модель: ${error instanceof Error ? error.message : String(error)}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
            });
            trace.getActiveSpan()?.end();
            throw fallbackError;
          }
        }

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

    // Traces will be flushed automatically by OpenTelemetry

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Interview Stream] Error:", error);
    // End span with error on exception
    trace.getActiveSpan()?.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    trace.getActiveSpan()?.end();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Wrap handler with observe() to create a Langfuse trace
export const POST = observe(handler, {
  name: "interview-chat-stream",
  endOnExit: false, // Don't end observation until stream finishes
});
