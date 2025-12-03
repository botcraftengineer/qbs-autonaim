import { z } from "zod";

export const sendCodeSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
});

export const signInSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
  phoneCode: z.string().min(1),
  phoneCodeHash: z.string().min(1),
  sessionData: z.string().optional(),
});

export const checkPasswordSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
  password: z.string().min(1),
  sessionData: z.string().min(1),
});

export const sendMessageSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  sessionData: z.string().min(1),
  chatId: z.union([z.string(), z.number()]),
  text: z.string().min(1),
});

export const sendMessageByUsernameSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  sessionData: z.string().min(1),
  username: z.string().min(1),
  text: z.string().min(1),
});

export const sendMessageByPhoneSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  sessionData: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
  text: z.string().min(1),
  firstName: z.string().optional(),
});

export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CheckPasswordInput = z.infer<typeof checkPasswordSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendMessageByUsernameInput = z.infer<
  typeof sendMessageByUsernameSchema
>;
export type SendMessageByPhoneInput = z.infer<typeof sendMessageByPhoneSchema>;
