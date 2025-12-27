/**
 * Скрипт миграции существующих workspaces в структуру с организациями
 *
 * Этот скрипт:
 * 1. Для каждого workspace owner создает организацию
 * 2. Связывает workspaces с созданными организациями
 * 3. Мигрирует workspace members в organization members
 * 4. Логирует прогресс и ошибки
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import slugify from "@sindresorhus/slugify";
import { eq } from "drizzle-orm";
import { db } from "../client";
import {
  organization,
  organizationMember,
  workspace,
  workspaceMember,
} from "../schema";

interface MigrationStats {
  totalWorkspaces: number;
  organizationsCreated: number;
  workspacesMigrated: number;
  membersMigrated: number;
  errors: Array<{ workspace: string; error: string }>;
}

/**
 * Генерирует slug из имени
 */
function generateSlug(name: string): string {
  const slug = slugify(name);
  return slug.length > 50 ? slug.substring(0, 50) : slug;
}

/**
 * Проверяет уникальность slug и добавляет суффикс если нужно
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Получает всех owners для каждого workspace
 */
async function getWorkspaceOwners() {
  const workspaces = await db.query.workspace.findMany({
    with: {
      members: {
        where: eq(workspaceMember.role, "owner"),
        with: {
          user: true,
        },
      },
    },
  });

  return workspaces;
}

/**
 * Создает организацию для workspace owner
 */
async function createOrganizationForOwner(
  ownerName: string,
  workspaceName: string,
  workspaceDescription?: string | null,
  workspaceWebsite?: string | null,
  workspaceLogo?: string | null,
) {
  const baseSlug = generateSlug(workspaceName || ownerName);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  const [newOrg] = await db
    .insert(organization)
    .values({
      name: workspaceName || `${ownerName}'s Organization`,
      slug: uniqueSlug,
      description: workspaceDescription || undefined,
      website: workspaceWebsite || undefined,
      logo: workspaceLogo || undefined,
    })
    .returning();

  if (!newOrg) {
    throw new Error("Не удалось создать организацию");
  }

  return newOrg;
}

/**
 * Основная функция миграции
 */
export async function migrateToOrganizations(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalWorkspaces: 0,
    organizationsCreated: 0,
    workspacesMigrated: 0,
    membersMigrated: 0,
    errors: [],
  };

  console.log("🚀 Начинаем миграцию к структуре с организациями...\n");

  try {
    // Получаем все workspaces с их owners
    const workspacesWithOwners = await getWorkspaceOwners();
    stats.totalWorkspaces = workspacesWithOwners.length;

    console.log(`📊 Найдено workspaces: ${stats.totalWorkspaces}\n`);

    // Обрабатываем каждый workspace
    for (const ws of workspacesWithOwners) {
      try {
        console.log(`\n📦 Обработка workspace: ${ws.name} (${ws.id})`);

        // Пропускаем если уже есть organizationId
        if (ws.organizationId) {
          console.log(`  ⏭️  Workspace уже привязан к организации, пропускаем`);
          continue;
        }

        // Проверяем наличие owners
        if (ws.members.length === 0) {
          console.log(`  ⚠️  Нет owners для workspace, пропускаем`);
          stats.errors.push({
            workspace: ws.id,
            error: "Нет owners для workspace",
          });
          continue;
        }

        // Берем первого owner (если их несколько)
        const primaryOwner = ws.members[0];
        if (!primaryOwner) {
          throw new Error("Primary owner не найден");
        }

        console.log(
          `  👤 Owner: ${primaryOwner.user.name || primaryOwner.user.email}`,
        );

        // Создаем организацию
        console.log(`  🏢 Создаем организацию...`);
        const org = await createOrganizationForOwner(
          primaryOwner.user.name || primaryOwner.user.email,
          ws.name,
          ws.description,
          ws.website,
          ws.logo,
        );
        stats.organizationsCreated++;
        console.log(`  ✅ Организация создана: ${org.name} (${org.slug})`);

        // Добавляем всех owners в organization_members
        console.log(`  👥 Добавляем owners в организацию...`);
        for (const ownerMember of ws.members) {
          await db.insert(organizationMember).values({
            organizationId: org.id,
            userId: ownerMember.userId,
            role: "owner",
          });
          stats.membersMigrated++;
        }
        console.log(`  ✅ Добавлено owners: ${ws.members.length}`);

        // Получаем всех остальных участников workspace
        const allMembers = await db.query.workspaceMember.findMany({
          where: eq(workspaceMember.workspaceId, ws.id),
        });

        // Добавляем не-owners в organization_members
        const nonOwners = allMembers.filter((m) => m.role !== "owner");
        if (nonOwners.length > 0) {
          console.log(`  👥 Добавляем остальных участников в организацию...`);
          for (const member of nonOwners) {
            // Проверяем, не добавлен ли уже
            const existing = await db.query.organizationMember.findFirst({
              where: (om, { and, eq }) =>
                and(
                  eq(om.organizationId, org.id),
                  eq(om.userId, member.userId),
                ),
            });

            if (!existing) {
              await db.insert(organizationMember).values({
                organizationId: org.id,
                userId: member.userId,
                role: member.role === "admin" ? "admin" : "member",
              });
              stats.membersMigrated++;
            }
          }
          console.log(`  ✅ Добавлено участников: ${nonOwners.length}`);
        }

        // Связываем workspace с организацией
        console.log(`  🔗 Связываем workspace с организацией...`);
        await db
          .update(workspace)
          .set({ organizationId: org.id })
          .where(eq(workspace.id, ws.id));
        stats.workspacesMigrated++;
        console.log(`  ✅ Workspace привязан к организации`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `  ❌ Ошибка при обработке workspace ${ws.id}:`,
          errorMessage,
        );
        stats.errors.push({
          workspace: ws.id,
          error: errorMessage,
        });
      }
    }

    // Выводим итоговую статистику
    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 ИТОГИ МИГРАЦИИ");
    console.log("=".repeat(60));
    console.log(`Всего workspaces:           ${stats.totalWorkspaces}`);
    console.log(`Организаций создано:        ${stats.organizationsCreated}`);
    console.log(`Workspaces мигрировано:     ${stats.workspacesMigrated}`);
    console.log(`Участников мигрировано:     ${stats.membersMigrated}`);
    console.log(`Ошибок:                     ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n⚠️  ОШИБКИ:");
      for (const error of stats.errors) {
        console.log(`  - Workspace ${error.workspace}: ${error.error}`);
      }
    }

    console.log("\n✅ Миграция завершена!");

    return stats;
  } catch (error) {
    console.error("\n❌ Критическая ошибка при миграции:", error);
    throw error;
  }
}

// Запуск скрипта если вызван напрямую
if (require.main === module) {
  migrateToOrganizations()
    .then((stats) => {
      if (stats.errors.length > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Миграция провалилась:", error);
      process.exit(1);
    });
}
