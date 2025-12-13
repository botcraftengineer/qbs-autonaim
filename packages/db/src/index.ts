export { alias } from "drizzle-orm/pg-core";
export * from "drizzle-orm/sql";

// Edge Runtime: Middleware, Edge API Routes, Next.js (HTTP - no native deps)
export { db as dbEdge } from "./client.edge";

// NOTE: db and dbWs use native modules (pg, ws) and will break Next.js builds
// Import them directly from "./client" or "./client.ws" in non-Next.js code only

export * from "./repositories/integration";
export * from "./repositories/vacancy-response.repository";
export * from "./repositories/workspace.repository";
export * from "./schema";
export * from "./utils/encryption";
