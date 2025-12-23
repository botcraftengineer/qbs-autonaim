import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../client";

async function applyUuidV7AndOrganizationIdFunctions() {
  try {
    const uuidV7Content = readFileSync(
      join(import.meta.dir, "uuid-v7.sql"),
      "utf-8",
    );

    await db.execute(sql.raw(uuidV7Content));
    console.log("✅ Функция UUID v7 успешно обновлена");

    const orgIdContent = readFileSync(
      join(import.meta.dir, "organization-id-generate.sql"),
      "utf-8",
    );

    await db.execute(sql.raw(orgIdContent));
    console.log("✅ Функция генерации ID организации успешно обновлена");

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при применении функций:", error);
    process.exit(1);
  }
}

applyUuidV7AndOrganizationIdFunctions();
