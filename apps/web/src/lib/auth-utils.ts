import "server-only";

import { db } from "@selectio/db/client";
import type { UserRole } from "@selectio/db/schema";
import { user } from "@selectio/db/schema";
import { eq } from "drizzle-orm";

export async function getUserRole(userId: string): Promise<UserRole> {
  const result = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return (result[0]?.role as UserRole) ?? "user";
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "admin";
}
