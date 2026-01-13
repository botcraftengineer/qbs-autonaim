#!/usr/bin/env bun
/**
 * Скрипт для пересчета счетчиков откликов для gigs
 * Использование:
 * bun run sync-gig-response-counts [workspaceId] [--all] [--force]
 */

import { count, eq, sql } from "@qbs-autonaim/db";
import { db, pool } from "@qbs-autonaim/db/client";
import { gig, response } from "@qbs-autonaim/db/schema";

async function syncGigResponseCounts(
  workspaceId?: string,
  options: { all?: boolean; force?: boolean } = {},
) {
  console.log("🚀 Начинаем синхронизацию счетчиков откликов для gigs...");

  try {
    // Определяем условие для выборки gigs
    const whereCondition = workspaceId
      ? eq(gig.workspaceId, workspaceId)
      : undefined;

    // Получаем все gigs для обработки
    const gigs = await db.query.gig.findMany({
      where: whereCondition,
      columns: {
        id: true,
        workspaceId: true,
        responses: true,
        newResponses: true,
      },
    });

    console.log(`📊 Найдено ${gigs.length} gigs для обработки`);

    if (gigs.length === 0) {
      console.log("✅ Нет gigs для обработки");
      return;
    }

    // Получаем актуальные счетчики одним запросом
    const responseCounts = await db
      .select({
        entityId: response.entityId,
        total: count(),
        newCount: sql<number>`count(case when ${response.status} = 'NEW' then 1 end)`,
      })
      .from(response)
      .where(eq(response.entityType, "gig"))
      .groupBy(response.entityId);

    // Создаем карту счетчиков
    const countsMap = new Map(
      responseCounts.map((count) => [
        count.entityId,
        { total: count.total, newCount: count.newCount },
      ]),
    );

    let updatedCount = 0;
    let processedCount = 0;

    // Обрабатываем каждый gig
    for (const gigItem of gigs) {
      processedCount++;

      const actualCounts = countsMap.get(gigItem.id) ?? {
        total: 0,
        newCount: 0,
      };
      const currentTotal = gigItem.responses ?? 0;
      const currentNew = gigItem.newResponses ?? 0;

      const needsUpdate =
        options.force ||
        actualCounts.total !== currentTotal ||
        actualCounts.newCount !== currentNew;

      if (needsUpdate) {
        await db
          .update(gig)
          .set({
            responses: actualCounts.total,
            newResponses: actualCounts.newCount,
          })
          .where(eq(gig.id, gigItem.id));

        updatedCount++;

        if (options.all) {
          console.log(
            `✅ Обновлен gig ${gigItem.id}: responses ${currentTotal}→${actualCounts.total}, newResponses ${currentNew}→${actualCounts.newCount}`,
          );
        }
      } else if (options.all) {
        console.log(`⏭️  Пропущен gig ${gigItem.id}: счетчики совпадают`);
      }
    }

    console.log(`\n🎉 Синхронизация завершена!`);
    console.log(`📈 Обработано: ${processedCount} gigs`);
    console.log(`🔄 Обновлено: ${updatedCount} gigs`);
    console.log(`⏰ Время выполнения: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Ошибка при синхронизации:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI интерфейс
const args = process.argv.slice(2);
const workspaceId = args.find((arg) => !arg.startsWith("--"));
const force = args.includes("--force");
const all = args.includes("--all");

if (!workspaceId && !all) {
  console.log("Использование:");
  console.log(
    "  bun run sync-gig-response-counts <workspaceId> [--force] [--all]",
  );
  console.log("  bun run sync-gig-response-counts --all [--force]");
  console.log("");
  console.log("Параметры:");
  console.log(
    "  workspaceId  - ID workspace для обработки конкретного workspace",
  );
  console.log("  --all        - Обработать все workspaces");
  console.log(
    "  --force      - Принудительно обновить все счетчики (даже если они совпадают)",
  );
  process.exit(1);
}

syncGigResponseCounts(workspaceId, { all, force });
