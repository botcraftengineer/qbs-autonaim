import { db } from "@qbs-autonaim/db/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

async function checkDomainHasSite(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    // Если получили ответ (любой статус), значит сайт существует
    return response.ok || response.status >= 300;
  } catch {
    // Если ошибка (таймаут, DNS не резолвится и т.д.), считаем что сайта нет
    return false;
  }
}

export const checkAvailability = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      domain: z
        .string()
        .min(3)
        .max(255)
        .regex(
          /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
        )
        .transform((val) => val.toLowerCase().trim()),
    }),
  )
  .query(async ({ input, ctx }) => {
    const member = await db.query.workspaceMember.findFirst({
      where: (member, { eq, and }) =>
        and(
          eq(member.workspaceId, input.workspaceId),
          eq(member.userId, ctx.session.user.id),
        ),
    });

    if (!member) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const existingDomain = await db.query.customDomain.findFirst({
      where: (domain, { eq }) => eq(domain.domain, input.domain),
    });

    if (existingDomain) {
      return {
        available: false,
        conflict: true,
        hasSite: false,
        domain: input.domain,
      };
    }

    // Проверяем, указывает ли домен на существующий сайт
    const hasSite = await checkDomainHasSite(input.domain);

    return {
      available: true,
      conflict: false,
      hasSite,
      domain: input.domain,
    };
  });
