import { initAuth } from "@qbs-autonaim/auth";
import { db } from "@qbs-autonaim/db";
import { organizationMember, user } from "@qbs-autonaim/db/schema";
import { eq } from "drizzle-orm";
import type { DemoUserIds } from "../types";

const auth = initAuth({
  baseUrl: process.env.APP_URL || "http://localhost:3000",
  productionUrl: process.env.APP_URL || "http://localhost:3000",
  secret: process.env.AUTH_SECRET,
});

const DEMO_ORG_ID = "org_demo_001";
const DEMO_WORKSPACE_ID = "ws_demo_001";

export async function createDemoUsers(): Promise<DemoUserIds> {
  console.log("\n👥 Создаем демо пользователей...");

  try {
    // User 1: Recruiter (Owner)
    await auth.api.signUpEmail({
      body: {
        email: "recruiter@demo.qbs.com",
        password: "demo123456",
        name: "Рекрутер Демо",
      },
    });

    const recruiterUser = await db.query.user.findFirst({
      where: eq(user.email, "recruiter@demo.qbs.com"),
    });

    if (!recruiterUser) throw new Error("Failed to create recruiter user");

    await db
      .insert(organizationMember)
      .values({
        userId: recruiterUser.id,
        organizationId: DEMO_ORG_ID,
        role: "owner",
      })
      .onConflictDoNothing();

    await db
      .update(user)
      .set({
        lastActiveOrganizationId: DEMO_ORG_ID,
        lastActiveWorkspaceId: DEMO_WORKSPACE_ID,
      })
      .where(eq(user.id, recruiterUser.id));

    console.log(`✅ Рекрутер создан: recruiter@demo.qbs.com (Владелец)`);

    // User 2: Manager (Admin)
    await auth.api.signUpEmail({
      body: {
        email: "manager@demo.qbs.com",
        password: "demo123456",
        name: "Менеджер Демо",
      },
    });

    const managerUser = await db.query.user.findFirst({
      where: eq(user.email, "manager@demo.qbs.com"),
    });

    if (!managerUser) throw new Error("Failed to create manager user");

    await db
      .insert(organizationMember)
      .values({
        userId: managerUser.id,
        organizationId: DEMO_ORG_ID,
        role: "admin",
      })
      .onConflictDoNothing();

    await db
      .update(user)
      .set({
        lastActiveOrganizationId: DEMO_ORG_ID,
        lastActiveWorkspaceId: DEMO_WORKSPACE_ID,
      })
      .where(eq(user.id, managerUser.id));

    console.log(`✅ Менеджер создан: manager@demo.qbs.com (Администратор)`);

    // User 3: Client (Member)
    await auth.api.signUpEmail({
      body: {
        email: "client@demo.qbs.com",
        password: "demo123456",
        name: "Клиент Демо",
      },
    });

    const clientUser = await db.query.user.findFirst({
      where: eq(user.email, "client@demo.qbs.com"),
    });

    if (!clientUser) throw new Error("Failed to create client user");

    await db
      .insert(organizationMember)
      .values({
        userId: clientUser.id,
        organizationId: DEMO_ORG_ID,
        role: "member",
      })
      .onConflictDoNothing();

    await db
      .update(user)
      .set({
        lastActiveOrganizationId: DEMO_ORG_ID,
        lastActiveWorkspaceId: DEMO_WORKSPACE_ID,
      })
      .where(eq(user.id, clientUser.id));

    console.log(`✅ Клиент создан: client@demo.qbs.com (Участник)`);

    return {
      recruiterId: recruiterUser.id,
      managerId: managerUser.id,
      clientId: clientUser.id,
    };
  } catch (error) {
    console.error("❌ Ошибка при создании демо пользователей:", error);
    throw error;
  }
}
