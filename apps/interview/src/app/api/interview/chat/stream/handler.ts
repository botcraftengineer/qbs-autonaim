/**
 * Публичный endpoint для AI-чата интервью
 * Доступен без авторизации, но защищён проверкой conversationId
 * Только для WEB интервью (source = 'WEB')
 *
 * Использует мультиагентную систему с поддержкой стриминга
 * Трассировка через Langfuse
 */

import { WebInterviewOrchestrator } from "@qbs-autonaim/ai";
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
      with: {
        messages: {
          with: {
            file: true,
          },
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
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
    let companySettings = null;

    if (conv.responseId) {
      const response = await db.query.vacancyResponse.findFirst({
        where: (r, { eq }) => eq(r.id, conv.responseId as string),
        with: {
          vacancy: {
            with: {
              workspace: {
                with: {
                  companySettings: true,
                },
              },
            },
          },
        },
      });
      vacancy = response?.vacancy;
      companySettings = response?.vacancy?.workspace?.companySettings;
    }

    if (conv.gigResponseId) {
      const gigResp = await db.query.gigResponse.findFirst({
        where: (r, { eq }) => eq(r.id, conv.gigResponseId as string),
        with: {
          gig: {
            with: {
              workspace: {
                with: {
                  companySettings: true,
                },
              },
            },
          },
        },
      });
      gig = gigResp?.gig;
      companySettings = gigResp?.gig?.workspace?.companySettings;
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
        await db.insert(conversationMessage).values({
          conversationId,
          sender: "CANDIDATE",
          contentType: "TEXT",
          channel: "WEB",
          content: userMessageText,
        });
      }
    }

    // Создаём trace в Langfuse (раньше, чтобы связать все запросы)
    const trace = langfuse.trace({
      name: "web-interview-chat",
      userId: conversationId,
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
    const conversationHistory = conv.messages
      .filter((msg) => msg.sender === "CANDIDATE" || msg.sender === "BOT")
      .map((msg) => ({
        sender: msg.sender as "CANDIDATE" | "BOT",
        content: msg.content,
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
        conversationId,
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
      conversationId,
      candidateName: conv.candidateName,
      vacancyTitle: vacancy?.title || gig?.title || null,
      vacancyDescription: vacancy?.description || gig?.description || null,
      conversationHistory,
      companySettings: companySettings
        ? {
            botName: companySettings.botName || undefined,
            botRole: companySettings.botRole || undefined,
            name: companySettings.name,
          }
        : undefined,
    };

    // Генерируем промпт в зависимости от типа интервью
    let systemPrompt: string;

    if (gig) {
      systemPrompt = orchestrator.buildGigPrompt(
        {
          title: gig.title,
          description: gig.description,
          type: gig.type,
          budgetMin: gig.budgetMin,
          budgetMax: gig.budgetMax,
          budgetCurrency: gig.budgetCurrency,
          estimatedDuration: gig.estimatedDuration,
          deadline: gig.deadline,
          customBotInstructions: gig.customBotInstructions,
          customOrganizationalQuestions: gig.customOrganizationalQuestions,
          customInterviewQuestions: gig.customInterviewQuestions,
        },
        interviewContext,
        isFirstResponse,
      );
    } else if (vacancy) {
      systemPrompt = orchestrator.buildVacancyPrompt(
        {
          title: vacancy.title,
          description: vacancy.description,
          region: vacancy.region,
          customBotInstructions: vacancy.customBotInstructions,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
          customInterviewQuestions: vacancy.customInterviewQuestions,
        },
        interviewContext,
        isFirstResponse,
      );
    } else {
      // Fallback
      systemPrompt = `Ты — опытный рекрутер, который проводит интервью с кандидатом.
Пиши коротко и естественно, как живой человек.
Задавай релевантные вопросы и будь вежливым.`;
    }

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
