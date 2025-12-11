import { z } from "zod";

/**
 * Zod схема для результата скрининга отклика
 */
export const responseScreeningResultSchema = z.object({
  score: z.number().int().min(0).max(5),
  detailedScore: z.number().int().min(0).max(100),
  analysis: z.string(),
});

export type ResponseScreeningResult = z.infer<
  typeof responseScreeningResultSchema
>;
