import { randomUUID } from "node:crypto";
import { and, eq } from "@qbs-autonaim/db";
import { gig, gigInterviewLink } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

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

export const generateInterviewLink = protectedProcedure
  .input(
    z.object({
      gigId: z.string().uuid(),
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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qbs.app";
      return {
        id: existingLink.id,
        gigId: existingLink.gigId,
        slug: existingLink.slug,
        url: `${baseUrl}/gig-interview/${existingLink.slug}`,
        isActive: existingLink.isActive,
        createdAt: existingLink.createdAt,
      };
    }

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
        gigId: input.gigId,
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qbs.app";

    return {
      id: created.id,
      gigId: created.gigId,
      slug: created.slug,
      url: `${baseUrl}/gig-interview/${created.slug}`,
      isActive: created.isActive,
      createdAt: created.createdAt,
    };
  });
