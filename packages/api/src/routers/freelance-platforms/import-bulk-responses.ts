import { and, eq } from "@qbs-autonaim/db";
import {
  freelanceImportHistory,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ResponseParser } from "../../services/response-parser";
import { protectedProcedure } from "../../trpc";

const importBulkResponsesInputSchema = z.object({
  vacancyId: z.string().uuid(),
  platformSource: z.enum([
    "kwork",
    "fl",
    "weblancer",
    "upwork",
    "freelancer",
    "fiverr",
  ]),
  rawText: z.string().min(1),
});

export interface ImportResult {
  success: boolean;
  responseId?: string;
  error?: string;
  freelancerName: string | null;
  platformProfileUrl?: string;
}

export const importBulkResponses = protectedProcedure
  .input(importBulkResponsesInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка существования вакансии
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { eq }) => eq(vacancy.id, input.vacancyId),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверка доступа к workspace вакансии
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      existingVacancy.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этой вакансии",
      });
    }

    // Парсим текст
    const parser = new ResponseParser();
    const parsedResponses = parser.parseBulk(input.rawText);

    if (parsedResponses.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Не удалось распарсить отклики из предоставленного текста",
      });
    }

    const results: ImportResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Обрабатываем каждый распарсенный отклик
    for (const parsed of parsedResponses) {
      try {
        // Валидация распарсенных данных
        const validation = parser.validateParsedData(parsed);

        if (!validation.isValid) {
          results.push({
            success: false,
            error: validation.errors.join(", "),
            freelancerName: parsed.freelancerName,
            platformProfileUrl: parsed.contactInfo.platformProfile,
          });
          failureCount++;
          continue;
        }

        // Проверка дубликатов по platformProfileUrl + vacancyId
        if (parsed.contactInfo.platformProfile) {
          const existingResponse = await ctx.db.query.vacancyResponse.findFirst(
            {
              where: and(
                eq(vacancyResponse.vacancyId, input.vacancyId),
                eq(
                  vacancyResponse.platformProfileUrl,
                  parsed.contactInfo.platformProfile,
                ),
              ),
            },
          );

          if (existingResponse) {
            results.push({
              success: false,
              error: "Отклик от этого фрилансера уже существует",
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            });
            failureCount++;
            continue;
          }
        }

        // Создаём запись отклика
        const [createdResponse] = await ctx.db
          .insert(vacancyResponse)
          .values({
            vacancyId: input.vacancyId,
            resumeId: parsed.contactInfo.platformProfile || crypto.randomUUID(),
            resumeUrl:
              parsed.contactInfo.platformProfile || "manual-import-no-url",
            candidateName: parsed.freelancerName,
            coverLetter: parsed.responseText,
            importSource: "FREELANCE_MANUAL",
            platformProfileUrl: parsed.contactInfo.platformProfile,
            phone: parsed.contactInfo.phone,
            telegramUsername: parsed.contactInfo.telegram,
            contacts: {
              email: parsed.contactInfo.email,
              phone: parsed.contactInfo.phone,
              telegram: parsed.contactInfo.telegram,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            },
            status: "NEW",
            respondedAt: new Date(),
          })
          .returning();

        if (createdResponse) {
          results.push({
            success: true,
            responseId: createdResponse.id,
            freelancerName: parsed.freelancerName,
            platformProfileUrl: parsed.contactInfo.platformProfile,
          });
          successCount++;
        } else {
          results.push({
            success: false,
            error: "Не удалось создать отклик",
            freelancerName: parsed.freelancerName,
            platformProfileUrl: parsed.contactInfo.platformProfile,
          });
          failureCount++;
        }
      } catch (error) {
        results.push({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Неизвестная ошибка при импорте",
          freelancerName: parsed.freelancerName,
          platformProfileUrl: parsed.contactInfo.platformProfile,
        });
        failureCount++;
      }
    }

    // Создаём запись в истории импорта
    await ctx.db.insert(freelanceImportHistory).values({
      vacancyId: input.vacancyId,
      importedBy: ctx.session.user.id,
      importMode: "BULK",
      platformSource: input.platformSource,
      rawText: input.rawText,
      parsedCount: parsedResponses.length,
      successCount,
      failureCount,
    });

    return {
      results,
      summary: {
        total: parsedResponses.length,
        success: successCount,
        failed: failureCount,
      },
    };
  });
