import { desc, eq } from "@qbs-autonaim/db";
import { conversation, conversationMessage } from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const listMessages = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ input, ctx }) => {
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

    const conv = await ctx.db.query.conversation.findFirst({
      where: eq(conversation.responseId, input.candidateId),
    });

    if (!conv) {
      return [];
    }

    const messages = await ctx.db.query.conversationMessage.findMany({
      where: eq(conversationMessage.conversationId, conv.id),
      orderBy: desc(conversationMessage.createdAt),
      limit: 100,
      with: {
        file: true,
      },
    });

    return Promise.all(
      messages.reverse().map(async (msg) => {
        const isVoice = msg.contentType === "VOICE";
        let voiceUrl: string | undefined;

        if (isVoice && msg.file?.key) {
          try {
            voiceUrl = await getDownloadUrl(msg.file.key);
          } catch (error) {
            console.error("Failed to generate presigned URL:", error);
          }
        }

        return {
          id: msg.id,
          conversationId: conv.id,
          content: isVoice
            ? msg.voiceTranscription || "Голосовое сообщение"
            : msg.content,
          sender: msg.sender === "CANDIDATE" ? "candidate" : "recruiter",
          senderName:
            msg.sender === "CANDIDATE"
              ? conv.candidateName || "Кандидат"
              : "Рекрутер",
          senderAvatar: null,
          timestamp: msg.createdAt,
          type: isVoice ? ("voice" as const) : ("text" as const),
          voiceUrl,
          voiceTranscription: msg.voiceTranscription || undefined,
          voiceDuration: msg.voiceDuration
            ? Number.parseInt(msg.voiceDuration, 10)
            : undefined,
        };
      }),
    );
  });
