import { chatEntityTypeEnum, chatSession } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { chatRegistry } from "../../services/chat/registry";
import { protectedProcedure } from "../../trpc";

export const createSession = protectedProcedure
  .input(
    z.object({
      entityType: z.enum(chatEntityTypeEnum.enumValues),
      entityId: z.string().uuid(),
      title: z.string().min(1).max(500).optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { entityType, entityId, title } = input;
    const userId = ctx.session.user.id;

    if (!chatRegistry.isRegistered(entityType)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Тип сущности ${entityType} не поддерживается`,
      });
    }

    // TODO: Проверка доступа к сущности

    const [session] = await ctx.db
      .insert(chatSession)
      .values({
        entityType,
        entityId,
        userId,
        title,
        messageCount: 0,
      })
      .returning();

    if (!session) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать сессию чата",
      });
    }

    return {
      id: session.id,
      entityType: session.entityType,
      entityId: session.entityId,
      title: session.title,
      status: session.status,
      messageCount: session.messageCount,
      lastMessageAt: session.lastMessageAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  });
