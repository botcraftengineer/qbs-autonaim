import { and, eq, sql } from "@qbs-autonaim/db";
import {
  type GigResponse,
  gig,
  gigImportSourceValues,
  gigResponse,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const createResponseSchema = z.object({
  gigId: z.string().uuid(),
  workspaceId: workspaceIdSchema,
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.string().url().optional(),
  telegramUsername: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  proposedPrice: z.number().int().positive().optional(),
  proposedCurrency: z.string().length(3).default("RUB"),
  proposedDeliveryDays: z.number().int().positive().optional(),
  coverLetter: z.string().optional(),
  portfolioLinks: z.array(z.string().url()).optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rating: z.string().max(20).optional(),
  importSource: z.enum(gigImportSourceValues).default("MANUAL"),
});

export const create = protectedProcedure
  .input(createResponseSchema)
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

    // Проверяем что gig существует и принадлежит workspace
    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Проверяем дубликат
    const existingResponse = await ctx.db.query.gigResponse.findFirst({
      where: and(
        eq(gigResponse.gigId, input.gigId),
        eq(gigResponse.candidateId, input.candidateId),
      ),
    });

    if (existingResponse) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Отклик от этого кандидата уже существует",
      });
    }

    let newResponse: GigResponse | undefined;
    try {
      const result = await ctx.db
        .insert(gigResponse)
        .values({
          gigId: input.gigId,
          candidateId: input.candidateId,
          candidateName: input.candidateName,
          profileUrl: input.profileUrl,
          telegramUsername: input.telegramUsername,
          phone: input.phone,
          email: input.email,
          proposedPrice: input.proposedPrice,
          proposedCurrency: input.proposedCurrency,
          proposedDeliveryDays: input.proposedDeliveryDays,
          coverLetter: input.coverLetter,
          portfolioLinks: input.portfolioLinks,
          experience: input.experience,
          skills: input.skills,
          rating: input.rating,
          importSource: input.importSource,
          respondedAt: new Date(),
        })
        .returning();
      newResponse = result[0];
    } catch (error) {
      // Обработка race condition: параллельный запрос успел вставить дубликат
      if (
        error instanceof Error &&
        (error.message.includes("unique constraint") ||
          error.message.includes("duplicate key"))
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Отклик от этого кандидата уже существует",
        });
      }
      throw error;
    }

    if (!newResponse) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать отклик",
      });
    }

    // Атомарно обновляем счётчик откликов
    await ctx.db
      .update(gig)
      .set({
        responses: sql`COALESCE(${gig.responses}, 0) + 1`,
        newResponses: sql`COALESCE(${gig.newResponses}, 0) + 1`,
      })
      .where(eq(gig.id, input.gigId));

    return newResponse;
  });
