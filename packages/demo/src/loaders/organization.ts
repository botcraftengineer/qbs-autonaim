import { db } from "@qbs-autonaim/db";
import type { DemoOrganization } from "../types";

const DEMO_ORG_ID = "org_demo_001";
const DEMO_WORKSPACE_ID = "ws_demo_001";

export async function createDemoOrganization(): Promise<DemoOrganization> {
  const { organization, workspace } = await import("@qbs-autonaim/db/schema");

  // Создаем демо-организацию
  console.log("\n🏢 Создаем демо-организацию...");
  const [demoOrg] = await db
    .insert(organization)
    .values({
      id: DEMO_ORG_ID,
      name: "Demo Organization",
      slug: "demo-org",
    })
    .onConflictDoNothing()
    .returning({ id: organization.id });

  const orgId = demoOrg?.id || DEMO_ORG_ID;
  console.log(`✅ Организация создана: ${orgId}`);

  // Создаем демо-workspace
  console.log("\n🏢 Создаем демо-workspace...");
  const [demoWorkspace] = await db
    .insert(workspace)
    .values({
      id: DEMO_WORKSPACE_ID,
      organizationId: orgId,
      name: "Demo Workspace",
      slug: "demo-workspace",
      description: "Демонстрационный workspace для тестирования",
    })
    .onConflictDoNothing()
    .returning({ id: workspace.id });

  const workspaceId = demoWorkspace?.id || DEMO_WORKSPACE_ID;
  console.log(`✅ Workspace создан: ${workspaceId}`);

  return {
    organizationId: orgId,
    workspaceId,
  };
}
