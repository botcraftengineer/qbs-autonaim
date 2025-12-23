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

    console.log("🚀 Buffer flush started", {
      userId,
      conversationId,
      interviewStep,
      flushId,
    });

    // Получение сообщений из буфера
    const messages = await step.run("get-buffered-messages", async () => {
      const bufferedMessages = await messageBufferService.getMessages({
        userId,
        conversationId,
        interviewStep,
      });

      console.log("📦 Retrieved buffered messages", {
        userId,
        conversationId,
        interviewStep,
        messageCount: bufferedMessages.length,
      });

      return bufferedMessages;
    });

    // Обработка пустого буфера
    if (messages.length === 0) {
      console.log("⚠️ Buffer is empty, skipping flush", {
        userId,
        conversationId,
        interviewStep,
        flushId,
      });
      return { skipped: true, reason: "Buffer is empty" };
    }

    // Агрегация сообщений
    const aggregatedContent = await step.run("aggregate-messages", async () => {
      const content = messages.map((m) => m.content).join("\n\n");

      console.log("📝 Messages aggregated", {
        userId,
        conversationId,
        interviewStep,
        messageCount: messages.length,
        totalLength: content.length,
      });

      return content;
    });

    // Получение контекста для текущего вопроса
    const currentQuestion = messages[0]?.questionContext || "";

    // Получение полного контекста интервью
    const context = await step.run("get-interview-context", async () => {
      console.log("📋 Getting interview context", {
        conversationId,
        currentQuestion,
      });

      const ctx = await getInterviewContext(
        conversationId,
        aggregatedContent,
        currentQuestion,
      );

      if (!ctx) {
        throw new Error("Interview context not found");
      }

      return ctx;
    });

    // Отправка в LLM
    const llmResponse = await step.run("send-to-llm", async () => {
      console.log("🤖 Sending to LLM", {
        conversationId,
        questionNumber: context.questionNumber,
        messageCount: messages.length,
      });

      try {
        const result = await analyzeAndGenerateNextQuestion(context);

        console.log("📊 LLM response received", {
          conversationId,
          shouldContinue: result.shouldContinue,
          hasQuestion: !!result.nextQuestion,
          reason: result.reason,
        });

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
        error: llmResponse.error,
        isAPIError: llmResponse.isAPIError,
      });

      // Очищаем буфер даже при ошибке
      await step.run("clear-buffer-on-error", async () => {
        await messageBufferService.clearBuffer({
          userId,
          conversationId,
          interviewStep,
        });

        console.log("🧹 Buffer cleared after error", {
          userId,
          conversationId,
          interviewStep,
        });

        return { cleared: true };
      });

      return {
        success: false,
        error: llmResponse.error,
        messageCount: messages.length,
        flushId,
        skippedResponse: true,
      };
    }

    const result = llmResponse.data;

    // Отправка ответа кандидату
    await step.run("send-response", async () => {
      if (result.shouldContinue && result.nextQuestion) {
        // Обычный флоу: продолжаем интервью с новым вопросом
        console.log("➡️ Sending next question", {
          conversationId,
          questionNumber: context.questionNumber,
        });

        await inngest.send({
          name: "telegram/interview.send-question",
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
        console.log("💬 Sending response without continuing", {
          conversationId,
          reason: result.reason,
        });

        await inngest.send({
          name: "telegram/interview.send-question",
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

        if (isSimpleAcknowledgment) {
          console.log("⏸️ Simple acknowledgment, not completing interview", {
            conversationId,
            reason: result.reason,
          });
        } else {
          // Завершаем интервью
          console.log("🏁 Completing interview", {
            conversationId,
            reason: result.reason,
          });

          await inngest.send({
            name: "telegram/interview.complete",
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

      console.log("🧹 Buffer cleared", {
        userId,
        conversationId,
        interviewStep,
      });

      return { cleared: true };
    });

    console.log("✅ Buffer flush completed", {
      userId,
      conversationId,
      interviewStep,
      flushId,
      messageCount: messages.length,
    });

    return {
      success: true,
      messageCount: messages.length,
      flushId,
      shouldContinue: llmResponse.shouldContinue,
    };
  },
);
