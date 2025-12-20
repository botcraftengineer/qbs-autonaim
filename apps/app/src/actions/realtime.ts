"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import {
  refreshVacancyResponsesChannel,
  screenAllResponsesChannel,
  screenNewResponsesChannel,
} from "@qbs-autonaim/jobs/channels";

/**
 * Server action для получения токена подписки на Realtime канал скрининга новых откликов
 */
export async function fetchScreenNewResponsesToken(vacancyId: string) {
  const { inngest } = await import("@qbs-autonaim/jobs/client");

  const token = await getSubscriptionToken(inngest, {
    channel: screenNewResponsesChannel(vacancyId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал скрининга всех откликов
 */
export async function fetchScreenAllResponsesToken(vacancyId: string) {
  const { inngest } = await import("@qbs-autonaim/jobs/client");

  const token = await getSubscriptionToken(inngest, {
    channel: screenAllResponsesChannel(vacancyId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал обновления откликов
 */
export async function fetchRefreshVacancyResponsesToken(vacancyId: string) {
  const { inngest } = await import("@qbs-autonaim/jobs/client");
  const token = await getSubscriptionToken(inngest, {
    channel: refreshVacancyResponsesChannel(vacancyId),
    topics: ["status"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на новые сообщения в чате
 */
export async function fetchTelegramMessagesToken(conversationId: string) {
  const { inngest } = await import("@qbs-autonaim/jobs/client");
  const token = await getSubscriptionToken(inngest, {
    channel: `telegram-messages-${conversationId}`,
    topics: ["message"],
  });

  return token;
}
