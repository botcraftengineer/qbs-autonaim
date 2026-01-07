import { conversation, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { messageBufferService } from "../../../services/buffer";
import {
  analyzeAndGenerateNextQuestion,
  getInterviewContext,
} from "../../../services/interview";
import { inngest } from "../../client";

/**
 * Функция flush буфера
 * Отправляет агрегированные сообщения в LLM
 * Идемпотентная операция
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3
 */
export const bufferFlushFunction = inngest.createFunction(
  {
    id: "interview-buffer-flush",
    name: "Interview Buffer Flush",
    idempotency: "event.data.flushId",
    retries: 3,
  },
  { event: "interview/buffer.flush" },
  async ({ event, step }) => {
    const { userId, conversationId, interviewStep, flushId } = event.data;

    // Определяем источник разговора для отправки правильных событий
    const conversationSource = await step.run(
      "get-conversation-source",
      async () => {
        const conv = await db.query.conversation.findFirst({
          where: eq(conversation.id, conversationId),
          columns: { source: true },
        });

        return conv?.source ?? "TELEGRAM";
      },
    );

    // Получение сообщений из буфера
    const messages = await step.run("get-buffered-messages", async () => {
      const bufferedMessages = await messageBufferService.getMessages({
        userId,
        conversationId,
        interviewStep,
      });

      return bufferedMessages;
    });

    // Обработка пустого буфера
    if (messages.length === 0) {
      return { skipped: true, reason: "Buffer is empty" };
    }

    // Агрегация сообщений
    const aggregatedContent = await step.run("aggregate-messages", async () => {
      const content = messages.map((m) => m.content).join("\n\n");

      return content;
    });

    // Получение полного контекста интервью
    const context = await step.run("get-interview-context", async () => {
      const ctx = await getInterviewContext(conversationId);

      if (!ctx) {
        throw new Error("Interview context not found");
      }

      return ctx;
    });

    // Отправка в LLM
    const llmResponse = await step.run("send-to-llm", async () => {
      try {
        const result = await analyzeAndGenerateNextQuestion(context);

        return { success: true, data: result };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Проверяем, является ли это ошибкой API (Bad Request и т.д.)
        const isAPIError =
          errorMessage.includes("Bad Request") ||
          errorMessage.includes("API") ||
          errorMessage.includes("AI_APICallError");

        console.error("❌ LLM request failed", {
          conversationId,
          error: errorMessage,
          isAPIError,
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          error: errorMessage,
          isAPIError,
        };
      }
    });

    // Проверяем успешность запроса к LLM
    if (!llmResponse.success) {
      console.error("❌ Skipping response due to LLM error", {
        conversationId,
        error: "error" in llmResponse ? llmResponse.error : "Unknown error",
        isAPIError:
          "isAPIError" in llmResponse ? llmResponse.isAPIError : false,
      });

      // Очищаем буфер даже при ошибке
      await step.run("clear-buffer-on-error", async () => {
        await messageBufferService.clearBuffer({
          userId,
          conversationId,
          interviewStep,
        });

        return { cleared: true };
      });

      return {
        success: false,
        error: "error" in llmResponse ? llmResponse.error : "Unknown error",
        messageCount: messages.length,
        flushId,
        skippedResponse: true,
      };
    }

    const result = "data" in llmResponse ? llmResponse.data : null;
    if (!result) {
      throw new Error("LLM response data is missing");
    }

    // Отправка ответа кандидату
    await step.run("send-response", async () => {
      // Определяем имя события в зависимости от источника
      const sendQuestionEvent =
        conversationSource === "WEB"
          ? "web/interview.send-question"
          : "telegram/interview.send-question";
      const completeEvent =
        conversationSource === "WEB"
          ? "web/interview.complete"
          : "telegram/interview.complete";

      if (result.shouldContinue && result.nextQuestion) {
        // Обычный флоу: продолжаем интервью с новым вопросом
        await inngest.send({
          name: sendQuestionEvent,
          data: {
            conversationId: context.conversationId,
            question: result.nextQuestion,
            transcription: aggregatedContent,
            questionNumber: context.questionNumber,
          },
        });
      } else if (
        result.nextQuestion &&
        result.nextQuestion !== "[SKIP]" &&
        result.nextQuestion.trim().length > 0
      ) {
        // Есть ответ кандидату, но shouldContinue=false
        await inngest.send({
          name: sendQuestionEvent,
          data: {
            conversationId: context.conversationId,
            question: result.nextQuestion,
            transcription: aggregatedContent,
            questionNumber: context.questionNumber,
          },
        });
      } else {
        // Проверяем на простое подтверждение
        const isSimpleAcknowledgment = result.isSimpleAcknowledgment === true;

        if (!isSimpleAcknowledgment) {
          // Завершаем интервью
          await inngest.send({
            name: completeEvent,
            data: {
              conversationId: context.conversationId,
              transcription: aggregatedContent,
              reason: result.reason ?? undefined,
              questionNumber: context.questionNumber,
              responseId: context.responseId ?? undefined,
            },
          });
        }
      }

      return {
        sent: true,
        shouldContinue: result.shouldContinue,
      };
    });

    // Очистка буфера
    await step.run("clear-buffer", async () => {
      await messageBufferService.clearBuffer({
        userId,
        conversationId,
        interviewStep,
      });

      return { cleared: true };
    });

    return {
      success: true,
      messageCount: messages.length,
      flushId,
      shouldContinue: result.shouldContinue,
    };
  },
);
