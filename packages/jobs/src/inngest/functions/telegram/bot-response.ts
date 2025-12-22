import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import type { getInterviewStartData } from "@qbs-autonaim/lib";
import { generateText } from "@qbs-autonaim/lib/ai";
import { buildTelegramRecruiterPrompt } from "@qbs-autonaim/prompts";
import { tempMessageBufferService } from "~/services/buffer/temp-message-buffer-service";
import { inngest } from "../../client";
import type { BotSettings, PromptStage } from "./types";
import { getConversationHistory } from "./utils";

export async function generateAndSendBotResponse(params: {
  conversationId: string;
  messageText: string;
  stage: PromptStage;
  botSettings: BotSettings;
  username?: string;
  firstName?: string;
  workspaceId: string;
  interviewData?: Awaited<ReturnType<typeof getInterviewStartData>>;
}) {
  const {
    conversationId,
    messageText,
    stage,
    botSettings,
    username,
    firstName,
    workspaceId,
    interviewData,
  } = params;

  const conversationHistory = await getConversationHistory(conversationId);
  const vacancy = interviewData?.response.vacancy;

  const prompt = buildTelegramRecruiterPrompt({
    messageText,
    stage,
    candidateName: interviewData?.response.candidateName ?? firstName,
    vacancyTitle: vacancy?.title ?? undefined,
    vacancyRequirements: vacancy?.requirements
      ? JSON.stringify(vacancy.requirements)
      : undefined,
    conversationHistory: conversationHistory.map((msg) => ({
      sender: msg.sender,
      content: msg.content,
      contentType: msg.contentType,
    })),
    resumeData: interviewData
      ? {
          experience: interviewData.response.experience ?? undefined,
          coverLetter: interviewData.response.coverLetter ?? undefined,
        }
      : undefined,
    customBotInstructions: vacancy?.customBotInstructions ?? undefined,
    customInterviewQuestions: vacancy?.customInterviewQuestions ?? undefined,
    customOrganizationalQuestions:
      vacancy?.customOrganizationalQuestions ?? undefined,
    botName: botSettings.botName,
    botRole: botSettings.botRole,
  });

  const { text: aiResponse } = await generateText({
    prompt,
    generationName: `telegram-${stage.toLowerCase()}`,
    entityId: conversationId,
    metadata: {
      candidateName: interviewData?.response.candidateName ?? firstName,
      vacancyTitle: vacancy?.title ?? undefined,
    },
  });

  // Проверяем SKIP - если AI решил не отвечать
  const trimmedResponse = aiResponse.trim();
  const shouldSkip =
    trimmedResponse === "[SKIP]" ||
    trimmedResponse.toLowerCase() === "skip" ||
    trimmedResponse === "";

  if (shouldSkip) {
    console.log("⏭️ Пропускаем отправку сообщения (AI вернул SKIP)", {
      conversationId,
      stage,
      messageText: messageText.substring(0, 50),
    });
    return null;
  }

  let botMsg = null;

  if (conversationId.startsWith("temp_")) {
    const chatId = conversationId.replace("temp_", "");

    await tempMessageBufferService.addMessage({
      tempConversationId: conversationId,
      chatId,
      message: {
        id: `bot_${crypto.randomUUID()}`,
        content: aiResponse,
        contentType: "TEXT",
        sender: "BOT",
        timestamp: new Date(),
      },
    });

    if (username) {
      await inngest.send({
        name: "telegram/message.send.by-username",
        data: {
          messageId: `temp_${crypto.randomUUID()}`,
          username,
          content: aiResponse,
          workspaceId,
        },
      });
    }
  } else {
    // Сохраняем в основную таблицу
    [botMsg] = await db
      .insert(conversationMessage)
      .values({
        conversationId,
        sender: "BOT",
        contentType: "TEXT",
        content: aiResponse,
      })
      .returning();

    if (botMsg && username) {
      await inngest.send({
        name: "telegram/message.send.by-username",
        data: {
          messageId: botMsg.id,
          username,
          content: aiResponse,
          workspaceId,
        },
      });
    }
  }

  return botMsg;
}
