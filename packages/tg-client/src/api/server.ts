import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createUserClient } from "../user-client";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "tg-client" });
});

// Отправить код авторизации
app.post("/auth/send-code", async (c) => {
  try {
    const { apiId, apiHash, phone } = await c.req.json();

    if (!apiId || !apiHash || !phone) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { client } = await createUserClient(apiId, apiHash);
    const result = await client.sendCode({ phone });

    if ("phoneCodeHash" in result) {
      return c.json({
        success: true,
        phoneCodeHash: result.phoneCodeHash,
        timeout: result.timeout,
      });
    }

    return c.json({ error: "User already authorized" }, 400);
  } catch (error) {
    console.error("Error sending code:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to send code",
      },
      500,
    );
  }
});

// Войти с кодом
app.post("/auth/sign-in", async (c) => {
  try {
    const { apiId, apiHash, phone, phoneCode, phoneCodeHash } =
      await c.req.json();

    if (!apiId || !apiHash || !phone || !phoneCode || !phoneCodeHash) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { client, storage } = await createUserClient(apiId, apiHash);
    const user = await client.signIn({ phone, phoneCode, phoneCodeHash });

    const sessionData = await storage.export();

    return c.json({
      success: true,
      sessionData,
      user: {
        id: user.id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        phone: "phone" in user ? user.phone : phone,
      },
    });
  } catch (error) {
    console.error("Error signing in:", error);

    if (error instanceof Error) {
      if (error.message.includes("SESSION_PASSWORD_NEEDED")) {
        return c.json({ error: "SESSION_PASSWORD_NEEDED" }, 400);
      }
      if (error.message.includes("PHONE_CODE_EXPIRED")) {
        return c.json({ error: "PHONE_CODE_EXPIRED" }, 400);
      }
      if (error.message.includes("PHONE_CODE_INVALID")) {
        return c.json({ error: "PHONE_CODE_INVALID" }, 400);
      }
    }

    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to sign in",
      },
      500,
    );
  }
});

// Войти с паролем 2FA
app.post("/auth/check-password", async (c) => {
  try {
    const { apiId, apiHash, phone, password, sessionData } = await c.req.json();

    if (!apiId || !apiHash || !phone || !password || !sessionData) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { client, storage } = await createUserClient(
      apiId,
      apiHash,
      sessionData,
    );
    const user = await client.checkPassword(password);

    const newSessionData = await storage.export();

    return c.json({
      success: true,
      sessionData: newSessionData,
      user: {
        id: user.id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        phone: "phone" in user ? user.phone : phone,
      },
    });
  } catch (error) {
    console.error("Error checking password:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check password",
      },
      500,
    );
  }
});

// Отправить сообщение
app.post("/messages/send", async (c) => {
  try {
    const { apiId, apiHash, sessionData, chatId, text } = await c.req.json();

    if (!apiId || !apiHash || !sessionData || !chatId || !text) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { client } = await createUserClient(apiId, apiHash, sessionData);
    const result = await client.sendText(chatId, text);

    return c.json({
      success: true,
      messageId: result.id.toString(),
      chatId: result.chat.id.toString(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      500,
    );
  }
});

// Отправить сообщение по username
app.post("/messages/send-by-username", async (c) => {
  try {
    const { apiId, apiHash, sessionData, username, text } = await c.req.json();

    if (!apiId || !apiHash || !sessionData || !username || !text) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { client } = await createUserClient(apiId, apiHash, sessionData);
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    const result = await client.sendText(cleanUsername, text);

    return c.json({
      success: true,
      messageId: result.id.toString(),
      chatId: result.chat.id.toString(),
    });
  } catch (error) {
    console.error("Error sending message by username:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      500,
    );
  }
});

// Отправить сообщение по телефону
app.post("/messages/send-by-phone", async (c) => {
  try {
    const { apiId, apiHash, sessionData, phone, text, firstName } =
      await c.req.json();

    if (!apiId || !apiHash || !sessionData || !phone || !text) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { client } = await createUserClient(apiId, apiHash, sessionData);
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (!cleanPhone.startsWith("+")) {
      return c.json({ error: "Phone must be in international format" }, 400);
    }

    const { Long } = await import("@mtcute/core");
    const importResult = await client.call({
      _: "contacts.importContacts",
      contacts: [
        {
          _: "inputPhoneContact",
          clientId: Long.fromNumber(Date.now()),
          phone: cleanPhone,
          firstName: firstName || "Кандидат",
          lastName: "",
        },
      ],
    });

    if (!importResult.users || importResult.users.length === 0) {
      return c.json({ error: "User not found in Telegram" }, 404);
    }

    const user = importResult.users[0];
    if (!user || user._ !== "user") {
      return c.json({ error: "Failed to get user data" }, 500);
    }

    const result = await client.sendText(user.id, text);

    return c.json({
      success: true,
      messageId: result.id.toString(),
      chatId: result.chat.id.toString(),
      userId: user.id.toString(),
    });
  } catch (error) {
    console.error("Error sending message by phone:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      500,
    );
  }
});

export default app;
