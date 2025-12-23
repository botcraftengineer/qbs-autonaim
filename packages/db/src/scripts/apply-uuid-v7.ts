import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../client";

async function applyUuidV7Function() {
  try {
    const uuidV7Content = readFileSync(
      join(import.meta.dir, "uuid-v7.sql"),
      "utf-8",
    );

    await db.execute(sql.raw(uuidV7Content));
    console.log("✅ UUID v7 function updated successfully");

    const orgIdContent = readFileSync(
      join(import.meta.dir, "organization-id-generate.sql"),
      "utf-8",
    );

    await db.execute(sql.raw(orgIdContent));
    console.log("✅ Organization ID generate function updated successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error applying functions:", error);
    process.exit(1);
  }
}

applyUuidV7Function();
