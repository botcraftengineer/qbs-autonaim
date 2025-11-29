import { channel, topic } from "@inngest/realtime";
import { db, inArray } from "@selectio/db";
import { vacancyResponse } from "@selectio/db/schema";
import { z } from "zod";
import { runEnricher } from "../parsers/hh/enricher";
import { inngest } from "./client";

export const parseNewResumesChannel = channel("parse-new-resumes").addTopic(
  topic("status").schema(
    z.object({
      status: z.string(),
      message: z.string(),
      total: z.number(),
      processed: z.number(),
    }),
  ),
);

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

    await publish(
      parseNewResumesChannel().status({
        status: "started",
        message: "Начинаем парсинг резюме",
        total: 0,
        processed: 0,
      }),
    );

    const vacancyIds = events.map((evt) => evt.data.vacancyId);
    console.log(`📋 Вакансии для обработки: ${vacancyIds.join(", ")}`);

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
        });

        // Фильтруем только отклики без детальной информации
        const results = allResponses.filter(
          (r) => !r.experience || r.experience === "",
        );

        console.log(`✅ Найдено откликов без деталей: ${results.length}`);

        await publish(
          parseNewResumesChannel().status({
            status: "processing",
            message: `Найдено ${results.length} резюме для парсинга`,
            total: results.length,
            processed: 0,
          }),
        );

        return results;
      },
    );

    if (responses.length === 0) {
      console.log("ℹ️ Нет откликов для парсинга");
      await publish(
        parseNewResumesChannel().status({
          status: "completed",
          message: "Нет новых резюме для парсинга",
          total: 0,
          processed: 0,
        }),
      );
      return {
        success: true,
        total: 0,
        processed: 0,
        failed: 0,
      };
    }

    // Запускаем enricher для парсинга резюме
    await step.run("enrich-resumes", async () => {
      await runEnricher();

      await publish(
        parseNewResumesChannel().status({
          status: "completed",
          message: "Парсинг резюме завершен",
          total: responses.length,
          processed: responses.length,
        }),
      );
    });

    return {
      success: true,
      total: responses.length,
      processed: responses.length,
      failed: 0,
    };
  },
);
