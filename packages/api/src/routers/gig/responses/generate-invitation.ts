import { randomUUID } from "node:crypto";
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

const adjectives = [
  "quick",
  "bright",
  "clever",
  "smart",
  "swift",
  "bold",
  "calm",
  "cool",
  "eager",
  "fair",
  "gentle",
  "happy",
  "jolly",
  "kind",
  "lively",
  "merry",
  "nice",
  "proud",
  "quiet",
  "sharp",
  "wise",
  "witty",
  "brave",
  "fresh",
];

const nouns = [
  "fox",
  "wolf",
  "bear",
  "lion",
  "tiger",
  "eagle",
  "hawk",
  "owl",
  "deer",
  "horse",
  "panda",
  "koala",
  "otter",
  "seal",
  "whale",
  "shark",
  "dragon",
  "phoenix",
  "falcon",
  "raven",
  "lynx",
  "jaguar",
  "leopard",
  "cheetah",
];

function generateSlug(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${noun}-${number}`;
}

function generateInvitationText(
  candidateName: string | null,
  gigTitle: string,
  interviewUrl: string,
): string {
  const name = candidateName || "Здравствуйте";

  // Простой шаблон для быстрой генерации
  const lines = [
    `${name}!`,
    "",
    `Спасибо за отклик на задание "${gigTitle}".`,
    "",
    "Для продолжения, пожалуйста, пройдите короткое интервью с нашим AI-ассистентом (5-10 минут):",
    interviewUrl,
    "",
    "После интервью мы свяжемся с вами для обсуждения деталей.",
  ];

  return lines.join("\n");
}

export const generateInvitation = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
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
      // Создаём новую ссылку
      let slug = generateSlug();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.db.query.gigInterviewLink.findFirst({
          where: eq(gigInterviewLink.slug, slug),
        });
        if (!existing) break;
        slug = `${generateSlug()}-${Date.now()}`;
        attempts++;
      }

      const [created] = await ctx.db
        .insert(gigInterviewLink)
        .values({
          gigId: response.gigId,
          token: randomUUID(),
          slug,
          isActive: true,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать ссылку на интервью",
        });
      }

      link = created;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qbs.app";
    const interviewUrl = `${baseUrl}/gig-interview/${link.slug}`;

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
