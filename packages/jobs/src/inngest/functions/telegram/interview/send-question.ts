import {
  and,
  chatMessage,
  chatSession,
  desc,
  eq,
  vacancyResponse,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { saveQuestionAnswer } from "../../../../services/interview";
import { inngest } from "../../../client";

/**
 * Функция для отправки следующего вопроса
 * Может быть запущена независимо
 */
export const sendNextQuestionFunction = inngest.createFunction(
  {
    id: "send-next-question",
    name: "Send Next Interview Question",
    retries: 3,
  },
  { event: "telegram/interview.send-question" },
  async ({ event, step }) => {
    const { chatSessionId, question, transcription, questionNumber } =
      event.data;

    // Проверяем SKIP в самом начале, до любых API вызовов
    const trimmedQuestion = question.trim();
    const shouldSkip =
      trimmedQuestion === "[SKIP]" ||
      trimmedQuestion === "" ||
      trimmedQuestion.toLowerCase() === "skip";

    if (shouldSkip) {
      return {
        success: true,
        chatSessionId,
        questionNumber,
        skipped: true,
      };
    }

    await step.run("save-qa", async () => {
      const lastBotMessages = await db
        .select()
        .from(chatMessage)
        .where(
          and(
            eq(chatMessage.sessionId, chatSessionId),
            eq(chatMessage.role, "assistant"),
          ),
        )
        .orderBy(desc(chatMessage.createdAt))
        .limit(1);

      const lastQuestion = lastBotMessages[0]?.content || "Первый вопрос";

      await saveQuestionAnswer(chatSessionId, lastQuestion, transcription);
    });

    const chatId = await step.run("get-chat-id", async () => {
      const [session] = await db
        .select()
        .from(chatSession)
        .where(eq(chatSession.id, chatSessionId))
        .limit(1);

      if (!session) {
        throw new Error("ChatSession не найден");
      }

      if (session.entityType !== "vacancy_response") {
        throw new Error("ChatSession не связан с vacancy_response");
      }

      const response = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, session.entityId),
      });

      if (!response?.chatId) {
        throw new Error("ChatId не найден в response");
      }

      return response.chatId;
    });

    const delay = await step.run("calculate-delay", () => {
      const questionLength = question.length;
      const baseDelay = 1000 + Math.random() * 1000;
      const typingDelay = questionLength * (30 + Math.random() * 20);
      const totalDelay = Math.min(baseDelay + typingDelay, 5000);

      return `${Math.round(totalDelay)}ms`;
    });

    await step.sleep("natural-delay", delay);

    await step.run("send-message", async () => {
      const [newMessage] = await db
        .insert(chatMessage)
        .values({
          sessionId: chatSessionId,
          role: "assistant",
          type: "text",
          content: question,
          channel: "telegram",
        })
        .returning();

      if (!newMessage) {
        throw new Error("Не удалось создать запись сообщения");
      }

      await inngest.send({
        name: "telegram/message.send",
        data: {
          messageId: newMessage.id,
          chatId,
          content: question,
        },
      });
    });

    return {
      success: true,
      chatSessionId,
      questionNumber: questionNumber + 1,
      skipped: false,
    };
  },
);
