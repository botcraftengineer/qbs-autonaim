import { randomUUID } from "node:crypto";
import { env, paths } from "@qbs-autonaim/config";
import { and, eq } from "@qbs-autonaim/db";
import { gig, gigInterviewLink } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { generateSlug } from "../../utils/slug-generator";

export const generateInterviewLink = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
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

    const foundGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!foundGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Гиг не найден",
      });
    }

    const existingLink = await ctx.db.query.gigInterviewLink.findFirst({
      where: and(
        eq(gigInterviewLink.gigId, input.gigId),
        eq(gigInterviewLink.isActive, true),
      ),
    });

    if (existingLink) {
      const baseUrl = env.NEXT_PUBLIC_APP_URL;
      return {
        id: existingLink.id,
        gigId: existingLink.gigId,
        slug: existingLink.slug,
        url: `${baseUrl}${paths.interview(existingLink.slug)}`,
        isActive: existingLink.isActive,
        createdAt: existingLink.createdAt,
      };
    }

    let slug = generateSlug();
    let attempts = 0;
    let created: typeof gigInterviewLink.$inferSelect | undefined;

    while (attempts < 10) {
      try {
        [created] = await ctx.db
          .insert(gigInterviewLink)
          .values({
            gigId: input.gigId,
            token: randomUUID(),
            slug,
            isActive: true,
          })
          .returning();

        break;
      } catch (error) {
        // Detect unique constraint violation
        const isUniqueError =
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error.code === "23505" || // Postgres unique violation
            (error.code === "SQLITE_CONSTRAINT" &&
              "message" in error &&
              typeof error.message === "string" &&
              error.message.includes("UNIQUE")));

        if (isUniqueError) {
          slug = `${generateSlug()}-${Date.now()}`;
          attempts++;
          continue;
        }

        // Non-unique error, rethrow
        throw error;
      }
    }

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать ссылку на интервью",
      });
    }

    const baseUrl = env.NEXT_PUBLIC_APP_URL;

    return {
      id: created.id,
      gigId: created.gigId,
      slug: created.slug,
      url: `${baseUrl}${paths.interview(created.slug)}`,
      isActive: created.isActive,
      createdAt: created.createdAt,
    };
  });
