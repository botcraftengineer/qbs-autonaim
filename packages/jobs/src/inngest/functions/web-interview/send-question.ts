import { conversationMessage, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
import { saveQuestionAnswer } from "../../../services/interview";
import { inngest } from "../../client";

/**
 * Функция отправки следующего вопроса в веб-чате
 * Сохраняет вопрос в conversation_messages
 */
export const webSendQuestionFunction = inngest.createFunction(
  {
    id: "web-interview-send-question",
    name: "Web Interview Send Question",
    retries: 3,
  },
  { event: "web/interview.send-question" },
  async ({ event, step }) => {
    const { conversationId, question, transcription, questionNumber } =
      event.data;

    console.log("📤 Sending question to web chat", {
      conversationId,
      questionNumber,
    });

    // Проверяем существование conversation
    await step.run("check-conversation", async () => {
      const c = await db.query.conversation.findFirst({
        where: eq(conversation.id, conversationId),
      });

      if (!c) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      return c;
    });

    // Сохраняем вопрос-ответ в метаданные
    await step.run("save-question-answer", async () => {
      await saveQuestionAnswer(conversationId, question, transcription);

      console.log("✅ Question-answer saved", {
        conversationId,
        questionNumber,
      });
    });

    // Сохраняем вопрос как сообщение от бота
    await step.run("save-message", async () => {
      await db.insert(conversationMessage).values({
        conversationId,
        sender: "BOT",
        contentType: "TEXT",
        channel: "TELEGRAM", // Используем TELEGRAM как универсальный канал
        content: question,
      });

      console.log("✅ Question message saved", {
        conversationId,
        questionNumber,
      });
    });

    console.log("✅ Question sent to web chat", {
      conversationId,
      questionNumber,
    });

    return {
      success: true,
      conversationId,
      questionNumber,
    };
  },
);
