import app from "./server";

const port = Number.parseInt(process.env.TG_CLIENT_PORT || "8001", 10);

console.log(`🚀 Starting Telegram Client API on port ${port}`);

export default {
  fetch: app.fetch,
  port,
};

console.log(`✅ Telegram Client API running on http://localhost:${port}`);
