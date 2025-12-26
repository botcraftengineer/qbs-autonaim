import { neonConfig, Pool } from "@neondatabase/serverless";
import { env } from "@qbs-autonaim/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

if (!env.POSTGRES_URL) {
  throw new Error(
    "Переменная окружения POSTGRES_URL не установлена. Пожалуйста, настройте её в окружении.",
  );
}

const pool = new Pool({ connectionString: env.POSTGRES_URL });

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});
