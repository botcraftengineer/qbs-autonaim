import { desc } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";

async function checkVoiceMessages() {
  console.log("🔍 Проверка голосовых сообщений в базе данных...\n");

  // Получаем последние 10 сообщений
  const recentMessages = await db.query.conversationMessage.findMany({
    orderBy: desc(conversationMessage.createdAt),
    limit: 10,
    with: {
      conversation: {
        columns: {
          id: true,
          username: true,
          status: true,
        },
      },
    },
  });

  console.log(`📊 Найдено сообщений: ${recentMessages.length}\n`);

  for (const msg of recentMessages) {
    console.log(`---`);
    console.log(`ID: ${msg.id}`);
    console.log(`Conversation ID: ${msg.conversationId}`);
    console.log(`Тип: ${msg.contentType}`);
    console.log(`Отправитель: ${msg.sender}`);
    console.log(`Контент: ${msg.content.substring(0, 50)}...`);
    console.log(`External Message ID: ${msg.externalMessageId}`);
    console.log(`File ID: ${msg.fileId || "нет"}`);
    console.log(`Voice Duration: ${msg.voiceDuration || "нет"}`);
    console.log(
      `Voice Transcription: ${msg.voiceTranscription ? "есть" : "нет"}`,
    );
    console.log(`Создано: ${msg.createdAt}`);
    console.log(`Username: ${msg.conversation?.username || "нет"}`);
    console.log();
  }

  // Проверяем голосовые сообщения
  const voiceMessages = await db.query.conversationMessage.findMany({
    where: (fields, { eq }) => eq(fields.contentType, "VOICE"),
    orderBy: desc(conversationMessage.createdAt),
    limit: 5,
  });

  console.log(`\n🎤 Голосовых сообщений: ${voiceMessages.length}\n`);

  for (const msg of voiceMessages) {
    console.log(`---`);
    console.log(`ID: ${msg.id}`);
    console.log(`Conversation ID: ${msg.conversationId}`);
    console.log(`External Message ID: ${msg.externalMessageId}`);
    console.log(`File ID: ${msg.fileId}`);
    console.log(`Duration: ${msg.voiceDuration}s`);
    console.log(`Transcription: ${msg.voiceTranscription ? "✅" : "❌"}`);
    console.log(`Создано: ${msg.createdAt}`);
    console.log();
  }

  process.exit(0);
}

checkVoiceMessages().catch((error) => {
  console.error("❌ Ошибка:", error);
  process.exit(1);
});
