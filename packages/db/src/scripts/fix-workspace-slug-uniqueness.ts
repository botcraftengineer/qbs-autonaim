/**
 * Скрипт для исправления уникальности slug'ов workspace
 *
 * Проблема: composite unique index (organizationId, slug) не работает
 * когда organizationId IS NULL, что позволяет дублировать slug'ы
 *
 * Решение:
 * 1. Находим все workspace с organization_id IS NULL
 * 2. Находим дубликаты slug'ов среди них
 * 3. Переименовываем дубликаты, добавляя суффикс
 */

import { sql } from "drizzle-orm";
import { db } from "../client";

interface DuplicateSlug {
  slug: string;
  count: number;
  workspaceIds: string[];
}

/**
 * Находит workspace с NULL organizationId и дублирующимися slug'ами
 */
async function findDuplicateSlugs(): Promise<DuplicateSlug[]> {
  const result = await db.execute<{
    slug: string;
    count: string;
    workspace_ids: string;
  }>(sql`
    SELECT 
      slug,
      COUNT(*) as count,
      array_agg(id ORDER BY created_at) as workspace_ids
    FROM workspaces
    WHERE organization_id IS NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
  `);

  return result.rows.map((row) => ({
    slug: row.slug,
    count: Number.parseInt(row.count, 10),
    workspaceIds: row.workspace_ids.replace(/[{}]/g, "").split(","),
  }));
}

/**
 * Генерирует уникальный slug с суффиксом
 */
function generateUniqueSlug(baseSlug: string, index: number): string {
  return `${baseSlug}-${index}`;
}

/**
 * Переименовывает дублирующиеся slug'ы
 */
async function renameDuplicateSlugs(
  duplicates: DuplicateSlug[],
): Promise<number> {
  let renamedCount = 0;

  for (const duplicate of duplicates) {
    console.log(
      `\n🔍 Обработка дубликатов для slug: "${duplicate.slug}" (${duplicate.count} workspace)`,
    );

    // Первый workspace оставляем с оригинальным slug
    // Остальные переименовываем
    for (let i = 1; i < duplicate.workspaceIds.length; i++) {
      const workspaceId = duplicate.workspaceIds[i];
      if (!workspaceId) continue;

      const newSlug = generateUniqueSlug(duplicate.slug, i);

      console.log(`  📝 Переименование workspace ${workspaceId}:`);
      console.log(`     ${duplicate.slug} → ${newSlug}`);

      await db.execute(sql`
        UPDATE workspaces
        SET slug = ${newSlug}
        WHERE id = ${workspaceId}
      `);

      renamedCount++;
    }
  }

  return renamedCount;
}

/**
 * Проверяет, что все workspace имеют organizationId
 */
async function checkOrphanedWorkspaces(): Promise<number> {
  const result = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*) as count
    FROM workspaces
    WHERE organization_id IS NULL
  `);

  return Number.parseInt(result.rows[0]?.count || "0", 10);
}

/**
 * Основная функция миграции
 */
export async function fixWorkspaceSlugUniqueness() {
  console.log("🚀 Начинаем исправление уникальности slug'ов workspace...\n");

  try {
    // Проверяем наличие workspace без organizationId
    const orphanedCount = await checkOrphanedWorkspaces();
    console.log(`📊 Найдено workspace без organizationId: ${orphanedCount}\n`);

    if (orphanedCount === 0) {
      console.log(
        "✅ Все workspace уже привязаны к организациям. Миграция не требуется.",
      );
      return {
        orphanedWorkspaces: 0,
        duplicatesFound: 0,
        workspacesRenamed: 0,
      };
    }

    console.log("⚠️  ВНИМАНИЕ: Найдены workspace без organizationId.");
    console.log(
      "   Сначала запустите migrate-orgs для привязки workspace к организациям.\n",
    );

    // Находим дубликаты
    const duplicates = await findDuplicateSlugs();
    console.log(`🔍 Найдено дублирующихся slug'ов: ${duplicates.length}\n`);

    if (duplicates.length === 0) {
      console.log("✅ Дубликатов не найдено!");
      return {
        orphanedWorkspaces: orphanedCount,
        duplicatesFound: 0,
        workspacesRenamed: 0,
      };
    }

    // Переименовываем дубликаты
    const renamedCount = await renameDuplicateSlugs(duplicates);

    // Итоговая статистика
    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 ИТОГИ МИГРАЦИИ");
    console.log("=".repeat(60));
    console.log(`Workspace без organizationId:  ${orphanedCount}`);
    console.log(`Дублирующихся slug'ов:         ${duplicates.length}`);
    console.log(`Workspace переименовано:       ${renamedCount}`);
    console.log("\n✅ Миграция завершена!");

    return {
      orphanedWorkspaces: orphanedCount,
      duplicatesFound: duplicates.length,
      workspacesRenamed: renamedCount,
    };
  } catch (error) {
    console.error("\n❌ Критическая ошибка при миграции:", error);
    throw error;
  }
}

// Запуск скрипта если вызван напрямую
if (require.main === module) {
  fixWorkspaceSlugUniqueness()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Миграция провалилась:", error);
      process.exit(1);
    });
}
