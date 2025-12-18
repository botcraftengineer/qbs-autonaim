import {
  and,
  conversation,
  conversationMessage,
  desc,
  eq,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  analyzeAndGenerateNextQuestion,
  getInterviewContext,
} from "../../../../services/interview";
import { inngest } from "../../../client";

/**
 * Основная функция для анализа интервью
 * Координирует весь процесс анализа и принимает решение о продолжении
 */
export const analyzeInterviewFunction = inngest.createFunction(
  {
    id: "analyze-interview",
    name: "Analyze Interview and Generate Next Question",
    retries: 3,
  },
  { event: "telegram/interview.analyze" },
  async ({ event, step }) => {
    const { conversationId, transcription } = event.data;

    const context = await step.run("get-interview-context", async () => {
      console.log("📋 Получение контекста интервью", {
        conversationId,
      });

      // Получаем последний вопрос от бота
      const [conv] = await db
        .select()
        .from(conversation)
        .where(eq(conversation.id, conversationId))
        .limit(1);

      if (!conv) {
        throw new Error("Conversation не найден");
      }

      // Получаем последнее сообщение от бота (это текущий вопрос)
      const lastBotMessages = await db
        .select()
        .from(conversationMessage)
        .where(
          and(
            eq(conversationMessage.conversationId, conversationId),
            eq(conversationMessage.sender, "BOT"),
          ),
        )
        .orderBy(desc(conversationMessage.createdAt))
        .limit(1);

      const lastBotMessage = lastBotMessages[0];
      const currentQuestion = lastBotMessage?.content || "Расскажи о себе";

      const ctx = await getInterviewContext(
        conversationId,
        transcription,
        currentQuestion,
      );

      if (!ctx) {
        throw new Error("Контекст интервью не найден");
      }

      return ctx;
    });

    const result = await step.run("analyze-and-generate-question", async () => {
      console.log("🤔 Анализ ответа и генерация следующего вопроса", {
        conversationId: context.conversationId,
        questionNumber: context.questionNumber,
      });

      const analysisResult = await analyzeAndGenerateNextQuestion(context);

      console.log("📊 Результат анализа", {
        shouldContinue: analysisResult.shouldContinue,
        hasQuestion: !!analysisResult.nextQuestion,
        analysis: analysisResult.analysis,
        reason: analysisResult.reason,
      });

      return analysisResult;
    });

    if (result.shouldContinue && result.nextQuestion) {
      await step.sendEvent("send-next-question-event", {
        name: "telegram/interview.send-question",
        data: {
          conversationId: context.conversationId,
          question: result.nextQuestion,
          transcription,
          questionNumber: context.questionNumber,
        },
      });
    } else if (result.nextQuestion) {
      await step.sendEvent("send-next-question-event", {
        name: "telegram/interview.send-question",
        data: {
          conversationId: context.conversationId,
          question: result.nextQuestion,
          transcription,
          questionNumber: context.questionNumber,
        },
      });
    } else {
      await step.sendEvent("complete-interview-event", {
        name: "telegram/interview.complete",
        data: {
          conversationId: context.conversationId,
          transcription,
          reason: result.reason ?? undefined,
          questionNumber: context.questionNumber,
          responseId: context.responseId ?? undefined,
        },
      });
    }

    return {
      success: true,
      conversationId,
      shouldContinue: result.shouldContinue,
      questionNumber: context.questionNumber,
    };
  },
);
