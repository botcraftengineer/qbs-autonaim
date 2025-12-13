import { inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { runEnricher } from "../../../parsers/hh/enricher";
import { parseNewResumesChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для парсинга резюме новых откликов (без детальной информации)
 */
export const parseNewResumesFunction = inngest.createFunction(
  {
    id: "parse-new-resumes",
    name: "Parse New Resumes",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "response/resume.parse-new" },
  async ({ events, step, publish }) => {
    console.log(`🚀 Запуск парсинга резюме для ${events.length} событий`);

    const vacancyIds = events.map((evt) => evt.data.vacancyId);
    console.log(`📋 Вакансии для обработки: ${vacancyIds.join(", ")}`);

    // Отправляем уведомление о начале для каждой вакансии
    for (const vacancyId of vacancyIds) {
      await publish(
        parseNewResumesChannel(vacancyId).progress({
          vacancyId,
          status: "started",
          message: "Начинаем парсинг резюме",
          total: 0,
          processed: 0,
        }),
      );
    }

    // Получаем отклики без детальной информации
    const responses = await step.run(
      "fetch-responses-without-details",
      async () => {
        const allResponses = await db.query.vacancyResponse.findMany({
          where: inArray(vacancyResponse.vacancyId, vacancyIds),
          columns: {
            id: true,
            vacancyId: true,
            resumeId: true,
            resumeUrl: true,
            candidateName: true,
            experience: true,
            contacts: true,
          },
          with: {
            vacancy: {
              columns: {
                workspaceId: true,
              },
            },
          },
        });

        // Фильтруем только отклики без детальной информации
        const results = allResponses.filter(
          (r) => !r.experience || r.experience === "",
        );

        console.log(`✅ Найдено откликов без деталей: ${results.length}`);

        // Отправляем прогресс для каждой вакансии
        for (const vacancyId of vacancyIds) {
          const vacancyResponses = results.filter(
            (r) => r.vacancyId === vacancyId,
          );
          await publish(
            parseNewResumesChannel(vacancyId).progress({
              vacancyId,
              status: "processing",
              message: `Найдено ${vacancyResponses.length} резюме для парсинга`,
              total: vacancyResponses.length,
              processed: 0,
            }),
          );
        }

        return results;
      },
    );

    if (responses.length === 0) {
      console.log("ℹ️ Нет откликов для парсинга");
      for (const vacancyId of vacancyIds) {
        await publish(
          parseNewResumesChannel(vacancyId).result({
            vacancyId,
            success: true,
            total: 0,
            processed: 0,
            failed: 0,
          }),
        );
      }
      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Запускаем enricher для парсинга резюме
    await step.run("enrich-resumes", async () => {
      const workspaceId = responses[0]?.vacancy.workspaceId;
      if (!workspaceId) {
        throw new Error("workspaceId не найден");
      }

      await runEnricher(workspaceId);

      // Отправляем финальный статус для каждой вакансии
      for (const vacancyId of vacancyIds) {
        const vacancyResponses = responses.filter(
          (r) => r.vacancyId === vacancyId,
        );
        await publish(
          parseNewResumesChannel(vacancyId).result({
            vacancyId,
            success: true,
            total: vacancyResponses.length,
            processed: vacancyResponses.length,
            failed: 0,
          }),
        );
      }
    });

    return {
      success: true,
      total: responses.length,
      processed: responses.length,
      failed: 0,
    };
  },
);
