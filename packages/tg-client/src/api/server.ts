import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./routes/auth";
import messages from "./routes/messages";

export const customLogger = (message: unknown) => {
  console.log(message);
};

const app = new Hono();

//app.use("*", logger());
app.use("*", cors());
app.use(logger(customLogger));

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "tg-client" });
});

app.route("/auth", auth);
app.route("/messages", messages);

export default app;
