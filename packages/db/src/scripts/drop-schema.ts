import { sql } from "@vercel/postgres";

async function dropSchema() {
  try {
    console.log("🗑️  Dropping database schemas...");

    // Drop public schema
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO public`;

    // Drop drizzle schema (migrations metadata)
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;

    console.log("✅ Database schemas dropped successfully!");
  } catch (error) {
    console.error("❌ Error dropping schemas:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

dropSchema();
