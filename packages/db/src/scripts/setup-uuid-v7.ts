import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../client";

async function setupUuidV7() {
  try {
    console.log("Настройка функции UUID v7...");

    const uuidV7Content = readFileSync(join(__dirname, "uuid-v7.sql"), "utf-8");
    await db.execute(sql.raw(uuidV7Content));
    console.log("✅ Функция UUID v7 успешно создана");

    console.log("Настройка функции генерации ID организации...");
    const orgIdContent = readFileSync(
      join(__dirname, "organization-id-generate.sql"),
      "utf-8",
    );
    await db.execute(sql.raw(orgIdContent));
    console.log("✅ Функция генерации ID организации успешно создана");
  } catch (error) {
    console.error("❌ Ошибка настройки функций:", error);
    throw error;
  }
}

setupUuidV7()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
