import type { Context } from "hono";
import type { ZodType } from "zod";

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

export function cleanPhoneNumber(phone: string): string {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function cleanUsername(username: string): string {
  return username.startsWith("@") ? username.slice(1) : username;
}

export function validateRequest<T>(c: Context, schema: ZodType<T>) {
  return async () => {
    const body = await c.req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false as const,
        error: c.json(
          { error: "Invalid request data", details: result.error.issues },
          400,
        ),
      };
    }

    return { success: true as const, data: result.data };
  };
}

export function handleError(error: unknown, defaultMessage: string) {
  console.error(defaultMessage, error);
  return error instanceof Error ? error.message : defaultMessage;
}

export function isAuthError(error: unknown, errorType: string): boolean {
  return error instanceof Error && error.message.includes(errorType);
}
