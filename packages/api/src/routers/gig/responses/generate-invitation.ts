import { and, eq } from "@qbs-autonaim/db";
import {
  gigInterviewLink,
  gigInvitation,
  gigResponse,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { getInterviewUrlFromDb } from "../../../utils/get-interview-url";
import { generateSlug } from "../../../utils/slug-generator";

function generateInvitationText(
  _candidateName: string | null,
  gigTitle: string,
  interviewUrl: string,
): string {
  // Простой краткий шаблон
  const lines = [
    "Здравствуйте!",
    "",
    `Спасибо за отклик на задание "${gigTitle}".`,
    "",
    "Для продолжения пройдите короткое интервью с AI-ассистентом (5-10 минут):",
    interviewUrl,
    "",
    "После интервью мы свяжемся с вами.",
  ];

  return lines.join("\n");
}

export const generateInvitation = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Получаем отклик с гигом
    const response = await ctx.db.query.gigResponse.findFirst({
      where: eq(gigResponse.id, input.responseId),
      with: {
        gig: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    if (response.gig.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Проверяем, есть ли уже приглашение
    const existingInvitation = await ctx.db.query.gigInvitation.findFirst({
      where: eq(gigInvitation.responseId, input.responseId),
    });

    if (existingInvitation) {
      return {
        id: existingInvitation.id,
        invitationText: existingInvitation.invitationText,
        interviewUrl: existingInvitation.interviewUrl,
        createdAt: existingInvitation.createdAt,
      };
    }

    // Получаем или создаём ссылку на интервью для гига
    let link = await ctx.db.query.gigInterviewLink.findFirst({
      where: and(
        eq(gigInterviewLink.gigId, response.gigId),
        eq(gigInterviewLink.isActive, true),
      ),
    });

    if (!link) {
      // Создаём новую ссылку с retry механизмом для обработки race condition
      const MAX_ATTEMPTS = 5;
      let lastError: unknown;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const token = generateSlug();

          const [created] = await ctx.db
            .insert(gigInterviewLink)
            .values({
              gigId: response.gigId,
              token,
              isActive: true,
            })
            .returning();

          if (created) {
            link = created;
            break;
          }
        } catch (error) {
          lastError = error;

          // Проверяем, является ли ошибка нарушением уникального ограничения
          const isUniqueViolation =
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error.code === "23505" || error.code === "SQLITE_CONSTRAINT");

          if (!isUniqueViolation) {
            // Если это не ошибка уникальности, пробрасываем её сразу
            throw error;
          }

          // Если это последняя попытка, выбрасываем ошибку
          if (attempt === MAX_ATTEMPTS - 1) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Не удалось создать уникальную ссылку на интервью после нескольких попыток",
              cause: lastError,
            });
          }

          // Иначе повторяем попытку с новым token
        }
      }

      if (!link) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать ссылку на интервью",
          cause: lastError,
        });
      }
    }

    const interviewUrl = await getInterviewUrlFromDb(
      ctx.db,
      link.token,
      input.workspaceId,
    );

    // Генерируем текст приглашения
    const invitationText = generateInvitationText(
      response.candidateName,
      response.gig.title,
      interviewUrl,
    );

    // Сохраняем приглашение
    const [invitation] = await ctx.db
      .insert(gigInvitation)
      .values({
        responseId: input.responseId,
        invitationText,
        interviewUrl,
      })
      .returning();

    if (!invitation) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось сохранить приглашение",
      });
    }

    return {
      id: invitation.id,
      invitationText: invitation.invitationText,
      interviewUrl: invitation.interviewUrl,
      createdAt: invitation.createdAt,
    };
  });
