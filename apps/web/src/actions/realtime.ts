"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import {
  refreshVacancyResponsesChannel,
  screenAllResponsesChannel,
  screenNewResponsesChannel,
} from "@selectio/jobs/channels";

/**
 * Server action для получения токена подписки на Realtime канал скрининга новых откликов
 */
export async function fetchScreenNewResponsesToken(vacancyId: string) {
  const { inngest } = await import("@selectio/jobs/client");

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
  const { inngest } = await import("@selectio/jobs/client");

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
  const { inngest } = await import("@selectio/jobs/client");
  const token = await getSubscriptionToken(inngest, {
    channel: refreshVacancyResponsesChannel(vacancyId),
    topics: ["status"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал проверки интеграций
 */
export async function fetchVerifyIntegrationToken(workspaceId: string) {
  const { inngest } = await import("@selectio/jobs/client");
  const { verifyIntegrationChannel } = await import("@selectio/jobs/channels");

  const token = await getSubscriptionToken(inngest, {
    channel: verifyIntegrationChannel(workspaceId),
    topics: ["integration-verify"],
  });

  return token;
}
