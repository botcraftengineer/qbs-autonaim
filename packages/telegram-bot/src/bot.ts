import { env } from "@selectio/config";
import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { telegramConversation, telegramMessage } from "@selectio/db/schema";
import { Bot } from "grammy";

const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN не установлен");
}

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command("start", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const username = ctx.from?.username;
  const startPayload = ctx.match; // Token from deep link

  console.log("🆔 Telegram Chat Info:", {
    chatId,
    username: username ? `@${username}` : "no username",
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
    startPayload,
  });

  let responseId: string | null = null;
  let candidateName = ctx.from?.first_name;
  let hasValidToken = false;

  // If we have invite token, link conversation to response
  if (startPayload && typeof startPayload === "string") {
    try {
      const { findResponseByInviteToken } = await import("@selectio/jobs");
      const responseResult = await findResponseByInviteToken(startPayload);

      if (responseResult.success) {
        responseId = responseResult.data.id;
        candidateName = responseResult.data.candidateName || candidateName;
        hasValidToken = true;

        console.log("✅ Linked conversation to response", {
          chatId,
          responseId,
          candidateName,
        });
      } else {
        console.warn("⚠️ Invalid invite token", { token: startPayload });
      }
    } catch (error) {
      console.error("❌ Error processing invite token", {
        error,
        startPayload,
      });
    }
  }

  // Always insert/update conversation, even with invalid token
  await db
    .insert(telegramConversation)
    .values({
      chatId,
      responseId: responseId || undefined,
      candidateName,
      status: "ACTIVE",
    })
    .onConflictDoUpdate({
      target: telegramConversation.chatId,
      set: {
        status: "ACTIVE",
        ...(responseId && { responseId }),
        ...(candidateName && { candidateName }),
      },
    })
    .returning();

  // Send appropriate reply based on token validity
  if (startPayload && typeof startPayload === "string") {
    if (hasValidToken) {
      await ctx.reply(
        `Привет${candidateName ? `, ${candidateName}` : ""}! 👋\n\nОтлично, что перешёл в Telegram! Здесь нам будет удобнее общаться.\n\nМожешь записать голосовое сообщение и рассказать о себе 🎤`,
      );
    } else {
      await ctx.reply(
        "Привет! Похоже, ссылка устарела или неверна. Попробуй получить новую ссылку от рекрутера.",
      );
    }
  } else {
    // If no invite token, show generic welcome
    await ctx.reply(
      `Привет! Я бот для общения с кандидатами.\n\nВаш Chat ID: ${chatId}\nUsername: ${username ? `@${username}` : "не указан"}`,
    );
  }
});

bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const messageText = ctx.message.text;

  const [conversation] = await db
    .select()
    .from(telegramConversation)
    .where(eq(telegramConversation.chatId, chatId))
    .limit(1);

  if (!conversation) {
    await ctx.reply("Пожалуйста, начните с команды /start");
    return;
  }

  await db.insert(telegramMessage).values({
    conversationId: conversation.id,
    sender: "CANDIDATE",
    contentType: "TEXT",
    content: messageText,
    telegramMessageId: ctx.message.message_id.toString(),
  });

  // Естественный ответ, напоминающий о голосовом формате
  const responses: string[] = [
    "Давай лучше голосом, так удобнее 🎤",
    "Запиши голосовое, пожалуйста",
    "Голосом будет проще, можешь записать?",
    "Лучше голосом ответь, окей?",
  ];
  const randomIndex = Math.floor(Math.random() * responses.length);
  await ctx.reply(responses[randomIndex] as string);
});

bot.on("message:voice", async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const voice = ctx.message.voice;

  const [conversation] = await db
    .select()
    .from(telegramConversation)
    .where(eq(telegramConversation.chatId, chatId))
    .limit(1);

  if (!conversation) {
    await ctx.reply("Пожалуйста, начните с команды /start");
    return;
  }

  try {
    const file = await ctx.api.getFile(voice.file_id);

    if (!file.file_path) {
      throw new Error("file_path не получен от Telegram API");
    }

    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    const { uploadFile } = await import("./storage");
    const fileId = await uploadFile(
      fileBuffer,
      `${voice.file_id}.ogg`,
      "audio/ogg",
    );

    const [voiceMessage] = await db
      .insert(telegramMessage)
      .values({
        conversationId: conversation.id,
        sender: "CANDIDATE",
        contentType: "VOICE",
        content: "Голосовое сообщение",
        fileId,
        voiceDuration: voice.duration.toString(),
        telegramMessageId: ctx.message.message_id.toString(),
      })
      .returning();

    if (!voiceMessage) {
      throw new Error("Не удалось создать запись сообщения");
    }

    // НЕ отправляем автоматический ответ - бот ответит после анализа
    // Это делает общение более естественным, как с живым человеком

    // Запускаем транскрибацию в фоне через Inngest HTTP API
    if (env.INNGEST_EVENT_KEY) {
      await fetch(
        `${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "telegram/voice.transcribe",
            data: {
              messageId: voiceMessage.id,
              fileId,
            },
          }),
        },
      );
    } else {
      console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
    }
  } catch (error) {
    console.error("Ошибка при обработке голосового сообщения:", error);
    await ctx.reply("Не смог прослушать, попробуй еще раз");
  }
});

export async function sendMessage(chatId: string, text: string) {
  const sentMessage = await bot.api.sendMessage(chatId, text);
  return sentMessage;
}
