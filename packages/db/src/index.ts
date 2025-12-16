export { alias } from "drizzle-orm/pg-core";
export * from "drizzle-orm/sql";
// Серверный db клиент для API роутов и фоновых задач
export { db } from "./client";
// Edge Runtime: Middleware, Edge API Routes, Next.js (HTTP - no native deps)
export { db as dbEdge } from "./client.edge";

export * from "./repositories/integration";
export * from "./repositories/vacancy-response.repository";
export * from "./repositories/workspace.repository";
export * from "./schema";
export * from "./utils/encryption";
