import { eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Получение presigned URLs для медиафайлов интервью
 * Возвращает массив файлов с их URL для показа кандидату
 */
export const getInterviewMedia = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      gigId: uuidv7Schema,
    }),
  )
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Получаем gig с медиафайлами
    const gigRecord = await ctx.db.query.gig.findFirst({
      where: eq(gig.id, input.gigId),
    });

    if (!gigRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    if (gigRecord.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому заданию",
      });
    }

    const fileIds = gigRecord.interviewMediaFileIds;
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    // Получаем файлы из БД
    const files = await ctx.db.query.file.findMany({
      where: (files, { inArray }) => inArray(files.id, fileIds),
    });

    // Генерируем presigned URLs
    const mediaFiles = await Promise.all(
      files.map(async (fileRecord) => {
        try {
          const url = await getDownloadUrl(fileRecord.key);
          return {
            id: fileRecord.id,
            url,
            fileName: fileRecord.fileName,
            mimeType: fileRecord.mimeType,
            fileSize: fileRecord.fileSize,
          };
        } catch {
          return null;
        }
      }),
    );

    return mediaFiles.filter((f) => f !== null);
  });
