import { Hono } from "hono";
import { createUserClient } from "../../user-client";
import {
  sendMessageByPhoneSchema,
  sendMessageByUsernameSchema,
  sendMessageSchema,
} from "../schemas";
import { cleanUsername, handleError } from "../utils";

const messages = new Hono();

messages.post("/send", async (c) => {
  try {
    const body = await c.req.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { apiId, apiHash, sessionData, chatId, text } = result.data;
    const { client } = await createUserClient(apiId, apiHash, sessionData);

    // Resolve the peer to ensure it's in the cache before sending
    try {
      const peer = await client.resolvePeer(chatId);
      const messageResult = await client.sendText(peer, text);
      return c.json({
        success: true,
        messageId: messageResult.id.toString(),
        chatId: messageResult.chat.id.toString(),
      });
    } catch (error) {
      return c.json(
        { error: handleError(error, "Failed to send message") },
        500,
      );
    }
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

messages.post("/send-by-username", async (c) => {
  try {
    const body = await c.req.json();
    const result = sendMessageByUsernameSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { apiId, apiHash, sessionData, username, text } = result.data;
    const { client } = await createUserClient(apiId, apiHash, sessionData);
    const cleanedUsername = cleanUsername(username);
    const messageResult = await client.sendText(cleanedUsername, text);

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

messages.post("/send-by-phone", async (c) => {
  try {
    const body = await c.req.json();
    const result = sendMessageByPhoneSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { apiId, apiHash, sessionData, phone, text, firstName } = result.data;

    const { client } = await createUserClient(apiId, apiHash, sessionData);

    if (!phone.startsWith("+")) {
      return c.json({ error: "Phone must be in international format" }, 400);
    }

    const { Long } = await import("@mtcute/core");
    const importResult = await client.call({
      _: "contacts.importContacts",
      contacts: [
        {
          _: "inputPhoneContact",
          clientId: Long.fromNumber(Date.now()),
          phone: phone,
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

    // Resolve the peer to ensure it's in the cache before sending
    try {
      await client.resolvePeer(user.id);
    } catch (_e) {
      // If peer resolution fails, try to get full user info to populate cache
      await client.call({
        _: "users.getFullUser",
        id: {
          _: "inputUser",
          userId: user.id,
          accessHash: user.accessHash || Long.ZERO,
        },
      });
    }

    const messageResult = await client.sendText(user.id, text);

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      userId: user.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

export default messages;
