import { getIntegration, workspaceRepository } from "@selectio/db";
import { inngest } from "@selectio/jobs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const verifyIntegration = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      type: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для проверки интеграций",
      });
    }

    const integration = await getIntegration(input.type, input.workspaceId);

    if (!integration) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Интеграция не найдена",
      });
    }

    if (input.type === "hh") {
      const { ids } = await inngest.send({
        name: "integration/hh.verify",
        data: {
          integrationId: integration.id,
          workspaceId: input.workspaceId,
        },
      });

      return {
        success: true,
        runId: ids[0],
      };
    }

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Неподдерживаемый тип интеграции",
    });
  });
