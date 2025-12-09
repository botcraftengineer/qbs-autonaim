import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { eq } from "drizzle-orm";
import { refreshVacancyResponses } from "../../../parsers/hh";
import { refreshVacancyResponsesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для обновления откликов конкретной вакансии
 * Парсит только отклики указанной вакансии через Puppeteer в headless режиме
 */
export const refreshVacancyResponsesFunction = inngest.createFunction(
  {
    id: "refresh-vacancy-responses",
    name: "Refresh Vacancy Responses",
    retries: 1,
    concurrency: 1,
  },
  { event: "vacancy/responses.refresh" },
  async ({ event, step, publish }) => {
    const { vacancyId } = event.data;

    await publish(
      refreshVacancyResponsesChannel(vacancyId).status({
        status: "started",
        message: "Начинаем обновление откликов",
        vacancyId,
      }),
    );

    return await step.run("parse-vacancy-responses", async () => {
      console.log(`🚀 Запуск обновления откликов для вакансии ${vacancyId}`);

      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
      });

      if (!vacancyData) {
        await publish(
          refreshVacancyResponsesChannel(vacancyId).status({
            status: "error",
            message: `Вакансия ${vacancyId} не найдена`,
            vacancyId,
          }),
        );
        throw new Error(`Вакансия ${vacancyId} не найдена`);
      }

      try {
        await publish(
          refreshVacancyResponsesChannel(vacancyId).status({
            status: "processing",
            message: "Получаем отклики с HeadHunter",
            vacancyId,
          }),
        );

        const { newCount } = await refreshVacancyResponses(
          vacancyId,
          vacancyData.workspaceId,
        );

        await publish(
          refreshVacancyResponsesChannel(vacancyId).status({
            status: "completed",
            message:
              newCount > 0
                ? `Отклики успешно обновлены. Новых откликов: ${newCount}`
                : "Отклики успешно обновлены. Новых откликов нет",
            vacancyId,
          }),
        );

        console.log(`✅ Отклики для вакансии ${vacancyId} обновлены успешно`);

        // Запускаем сбор chat_id после получения откликов
        await step.run("trigger-chat-ids-collection", async () => {
          console.log(`🔄 Запускаем сбор chat_id для вакансии ${vacancyId}`);
          await inngest.send({
            name: "vacancy/chat-ids.collect",
            data: { vacancyId },
          });
          console.log(
            `✅ Событие сбора chat_id отправлено для вакансии ${vacancyId}`,
          );
        });

        return { success: true, vacancyId, newCount };
      } catch (error) {
        console.error(
          `❌ Ошибка при обновлении откликов вакансии ${vacancyId}:`,
          error,
        );
        await publish(
          refreshVacancyResponsesChannel(vacancyId).status({
            status: "error",
            message:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            vacancyId,
          }),
        );
        throw error;
      }
    });
  },
);
