import { inngest } from "../inngest/client";

/**
 * Triggers vacancy requirements extraction job via Inngest
 */
export async function triggerVacancyRequirementsExtraction(
  vacancyId: string,
  description: string,
): Promise<void> {
  try {
    await inngest.send({
      name: "vacancy/requirements.extract",
      data: {
        vacancyId,
        description,
      },
    });

    console.log(`✅ Inngest event sent for vacancy: ${vacancyId}`);
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для ${vacancyId}:`,
      error,
    );
    // Не пробрасываем ошибку, чтобы не блокировать основной процесс
  }
}

/**
 * Triggers response screening job via Inngest
 */
export async function triggerResponseScreening(
  responseId: string,
): Promise<void> {
  try {
    await inngest.send({
      name: "response/screen",
      data: {
        responseId,
      },
    });

    console.log(`✅ Inngest event sent for response: ${responseId}`);
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для ${responseId}:`,
      error,
    );
    // Не пробрасываем ошибку, чтобы не блокировать основной процесс
  }
}

/**
 * Triggers active vacancies update job via Inngest
 */
export async function triggerVacanciesUpdate(): Promise<void> {
  try {
    await inngest.send({
      name: "vacancy/update.active",
      data: {},
    });

    console.log(`✅ Inngest event sent for vacancies update`);
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для обновления вакансий:`,
      error,
    );
  }
}

/**
 * Triggers vacancy responses refresh job via Inngest
 */
export async function triggerVacancyResponsesRefresh(
  vacancyId: string,
): Promise<void> {
  try {
    await inngest.send({
      name: "vacancy/responses.refresh",
      data: {
        vacancyId,
      },
    });

    console.log(
      `✅ Inngest event sent for vacancy responses refresh: ${vacancyId}`,
    );
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для обновления откликов вакансии ${vacancyId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Triggers candidate welcome message job via Inngest
 */
export async function triggerCandidateWelcome(
  responseId: string,
  username: string,
): Promise<void> {
  try {
    await inngest.send({
      name: "candidate/welcome",
      data: {
        responseId,
        username,
      },
    });

    console.log(
      `✅ Inngest event sent for candidate welcome to @${username} (response: ${responseId})`,
    );
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для приветствия кандидата ${responseId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Triggers telegram message send job via Inngest
 */
export async function triggerTelegramMessageSend(
  messageId: string,
  chatId: string,
  content: string,
): Promise<void> {
  try {
    await inngest.send({
      name: "telegram/message.send",
      data: {
        messageId,
        chatId,
        content,
      },
    });

    console.log(
      `✅ Inngest event sent for telegram message: ${messageId} to chat: ${chatId}`,
    );
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для отправки сообщения ${messageId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Triggers voice transcription job via Inngest
 */
export async function triggerVoiceTranscription(
  messageId: string,
  fileId: string,
): Promise<void> {
  try {
    await inngest.send({
      name: "telegram/voice.transcribe",
      data: {
        messageId,
        fileId,
      },
    });

    console.log(`✅ Inngest event sent for voice transcription: ${messageId}`);
  } catch (error) {
    console.error(
      `❌ Ошибка отправки Inngest события для транскрибации ${messageId}:`,
      error,
    );
    throw error;
  }
}
