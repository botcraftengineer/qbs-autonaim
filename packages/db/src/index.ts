export { alias } from "drizzle-orm/pg-core";
export * from "drizzle-orm/sql";

// Default: Server Components & Server Actions (node-postgres pool)
export { db } from "./client";

// Edge Runtime: Middleware, Edge API Routes (HTTP)
export { db as dbEdge } from "./client.edge";

// WebSocket: High-load Route Handlers (persistent connections)
export { db as dbWs } from "./client.ws";

export * from "./repositories/integration";
export * from "./repositories/vacancy-response.repository";
export * from "./repositories/workspace.repository";
export * from "./schema";
export * from "./utils/encryption";
