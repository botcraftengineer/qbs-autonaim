import { db, inArray } from "@selectio/db";
import { vacancyResponse } from "@selectio/db/schema";
import { screenResponse } from "../services/response-screening-service";
import { inngest } from "./client";

/**
 * Inngest функция для оценки только новых откликов (без скрининга)
 */
export const screenNewResponsesFunction = inngest.createFunction(
  {
    id: "screen-new-responses",
    name: "Screen New Responses",
    batchEvents: {
      maxSize: 50,
      timeout: "10s",
    },
  },
  { event: "response/screen.new" },
  async ({ events, step }) => {
    console.log(`🚀 Запуск оценки новых откликов для ${events.length} событий`);

    // Собираем все vacancyIds из всех событий
    const vacancyIds = events.map((evt) => evt.data.vacancyId);

    console.log(`📋 Вакансии для обработки: ${vacancyIds.join(", ")}`);

    // Получаем новые отклики (без скрининга)
    const responses = await step.run("fetch-new-responses", async () => {
      const allResponses = await db.query.vacancyResponse.findMany({
        where: inArray(vacancyResponse.vacancyId, vacancyIds),
        columns: {
          id: true,
          vacancyId: true,
        },
        with: {
          screening: true,
        },
      });

      // Фильтруем только отклики без скрининга
      const results = allResponses.filter((r) => !r.screening);

      console.log(`✅ Найдено новых откликов: ${results.length}`);
      return results;
    });

    if (responses.length === 0) {
      console.log("ℹ️ Нет новых откликов для оценки");
      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responses.map(async (response) => {
        return await step.run(`screen-response-${response.id}`, async () => {
          try {
            console.log(`🎯 Скрининг отклика: ${response.id}`);

            const result = await screenResponse(response.id);

            console.log(`✅ Скрининг завершен: ${response.id}`, {
              score: result.score,
              detailedScore: result.detailedScore,
            });

            return {
              responseId: response.id,
              success: true,
              score: result.score,
            };
          } catch (error) {
            console.error(`❌ Ошибка скрининга для ${response.id}:`, error);
            return {
              responseId: response.id,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `✅ Завершено: успешно ${successful}, ошибок ${failed} из ${responses.length}`,
    );

    return {
      success: true,
      total: responses.length,
      processed: successful,
      failed,
    };
  },
);
