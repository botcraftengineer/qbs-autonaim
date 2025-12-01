import { decryptCredentials, getAllIntegrations } from "@selectio/db";
import { protectedProcedure } from "../../trpc";

export const listIntegrations = protectedProcedure.query(async () => {
  const integrations = await getAllIntegrations();

  // Не возвращаем credentials на клиент, только email
  return integrations.map((int: (typeof integrations)[number]) => {
    let email: string | null = null;

    if (int.credentials) {
      try {
        const decrypted = decryptCredentials(
          int.credentials as Record<string, string>,
        );
        email = decrypted.email || null;
      } catch (error) {
        console.error("Failed to decrypt credentials:", error);
      }
    }

    return {
      id: int.id,
      type: int.type,
      name: int.name,
      isActive: int.isActive,
      lastUsedAt: int.lastUsedAt,
      createdAt: int.createdAt,
      updatedAt: int.updatedAt,
      hasCookies: !!int.cookies,
      hasCredentials: !!int.credentials,
      email,
    };
  });
});
