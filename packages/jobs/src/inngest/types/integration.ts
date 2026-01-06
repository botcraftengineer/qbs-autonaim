import { z } from "zod";

export const verifyHHCredentialsDataSchema = z.object({
  email: z.email(),
  password: z.string(),
  workspaceId: z.string(),
});

export type VerifyHHCredentialsData = z.infer<
  typeof verifyHHCredentialsDataSchema
>;
