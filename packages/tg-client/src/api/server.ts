import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { botManager } from "../bot-manager";
import auth from "./routes/auth";
import files from "./routes/files";
import messages from "./routes/messages";
import sessions from "./routes/sessions";

export const customLogger = (message: unknown) => {
  console.log(message);
};

const app = new Hono();

app.use("*", logger());
app.use("*", cors());
app.use(logger(customLogger));

app.get("/health", (c) => {
  const botsCount = botManager.getBotsCount();
  return c.json({
    status: "ok",
    service: "tg-client",
    activeSessions: botsCount,
  });
});

app.get("/bots/status", (c) => {
  const bots = botManager.getBotsInfo();
  return c.json({
    count: bots.length,
    bots: bots.map((bot) => ({
      sessionId: bot.sessionId,
      hasUsername: !!bot.username,
    })),
  });
});

app.route("/auth", auth);
app.route("/messages", messages);
app.route("/files", files);
app.route("/sessions", sessions);

export default app;
