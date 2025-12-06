import { z } from "zod";

// Login form validation schema
export const loginFormSchema = z.object({
  email: z.email({ error: "Некорректный email адрес" }),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
