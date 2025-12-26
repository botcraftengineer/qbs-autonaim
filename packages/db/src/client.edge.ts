import { neon } from "@neondatabase/serverless";
import { env } from "@qbs-autonaim/config";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

if (!env.POSTGRES_URL) {
  throw new Error(
    "Переменная окружения POSTGRES_URL не установлена. Пожалуйста, настройте её в окружении.",
  );
}

const sql = neon(env.POSTGRES_URL);
const db = drizzle(sql, {
  schema,
  casing: "snake_case",
});

export default db;

export { db };
