import { z } from "zod";

/**
 * Gig-related event schemas
 */

export const gigRankingRecalculateDataSchema = z.object({
  gigId: z.string().uuid("ID гига должен быть валидным UUID"),
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  triggeredBy: z.string().optional(),
});

export const gigResponseEvaluateDataSchema = z.object({
  responseId: z.string().uuid("ID отклика должен быть валидным UUID"),
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  conversationId: z.string().min(1, "ID диалога обязателен"),
});
