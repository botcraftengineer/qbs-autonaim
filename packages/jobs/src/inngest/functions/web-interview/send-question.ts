import { eq, interviewMessage, interviewSession } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { saveQuestionAnswer } from "../../../services/interview";
import { inngest } from "../../client";

/**
 * Функция отправки следующего вопроса в веб-чате
 * Сохраняет вопрос в interview_messages
 */
export const webSendQuestionFunction = inngest.createFunction(
  {
    id: "web-interview-send-question",
    name: "Web Interview Send Question",
    retries: 3,
  },
  { event: "web/interview.send-question" },
  async ({ event, step }) => {
    const { chatSessionId, question, transcription, questionNumber } =
      event.data;

    console.log("📤 Sending question to web chat", {
      chatSessionId,
      questionNumber,
    });

    // Проверяем существование interviewSession
    const session = await step.run("check-interview-session", async () => {
      const s = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
      });

      if (!s) {
        throw new Error(`InterviewSession ${chatSessionId} not found`);
      }

      return s;
    });

    // Сохраняем вопрос-ответ в метаданные
    await step.run("save-question-answer", async () => {
      await saveQuestionAnswer(chatSessionId, question, transcription);

      console.log("✅ Question-answer saved", {
        chatSessionId,
        questionNumber,
      });
    });

    // Сохраняем вопрос как сообщение от бота
    await step.run("save-message", async () => {
      await db.insert(interviewMessage).values({
        sessionId: chatSessionId,
        role: "assistant",
        type: "text",
        channel: session.lastChannel ?? "web",
        content: question,
      });

      console.log("✅ Question message saved", {
        chatSessionId,
        questionNumber,
      });
    });

    console.log("✅ Question sent to web chat", {
      chatSessionId,
      questionNumber,
    });

    return {
      success: true,
      chatSessionId,
      questionNumber,
    };
  },
);
