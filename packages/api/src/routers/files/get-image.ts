
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Получение presigned URL для изображения с контролем доступа
 *
 * Преимущества этого подхода:
 * - Проверка прав доступа к workspace перед выдачей URL
 * - Короткое время жизни URL (5 минут) для безопасности
 * - Прямой доступ к S3 без нагрузки на сервер при скачивании
 * - Скрытие структуры S3 от клиента (URL генерируется на сервере)
 *
 * Использование на фронтенде:
 * 1. Получить fileId из списка кандидатов (avatarFileId)
 * 2. Вызвать api.files.getImageUrl({ workspaceId, fileId })
 * 3. Использовать полученный URL в <img src={url} />
 * 4. При необходимости обновить URL через 5 минут
 */
export const getImageUrl = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      fileId: uuidv7Schema,
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

    // Получаем файл из БД с проверкой принадлежности к workspace
    // Файлы могут быть связаны через:
    // 1. vacancyResponse (resumePdfFileId, photoFileId) → vacancy → workspace
    // 2. conversationMessage (fileId) → conversation → vacancyResponse → vacancy → workspace
    const fileRecord = await ctx.db.query.file.findFirst({
      where: (files, { eq }) => eq(files.id, input.fileId),
      with: {
        // Проверяем связь через vacancyResponse (resumePdfFileId)
        vacancyResponsesAsResumePdf: {
          with: {
            vacancy: true,
          },
        },
        // Проверяем связь через vacancyResponse (photoFileId)
        vacancyResponsesAsPhoto: {
          with: {
            vacancy: true,
          },
        },
        // Проверяем связь через conversationMessage
        conversationMessages: {
          with: {
            conversation: {
              with: {
                response: {
                  with: {
                    vacancy: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!fileRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Файл не найден",
      });
    }

    // Проверяем что файл принадлежит указанному workspace
    const belongsToWorkspace =
      fileRecord.vacancyResponsesAsResumePdf.some(
        (response) => response.vacancy.workspaceId === input.workspaceId,
      ) ||
      fileRecord.vacancyResponsesAsPhoto.some(
        (response) => response.vacancy.workspaceId === input.workspaceId,
      ) ||
      fileRecord.conversationMessages.some(
        (message) =>
          message.conversation?.response?.vacancy?.workspaceId ===
          input.workspaceId,
      );

    if (!belongsToWorkspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Файл не найден",
      });
    }

    // Проверяем что это изображение
    if (!fileRecord.mimeType?.startsWith("image/")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Файл не является изображением",
      });
    }

    try {
      // Генерируем presigned URL с коротким временем жизни (5 минут)
      const url = await getDownloadUrl(fileRecord.key);

      return {
        url,
        mimeType: fileRecord.mimeType,
        fileName: fileRecord.fileName,
      };
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при получении URL файла",
      });
    }
  });
