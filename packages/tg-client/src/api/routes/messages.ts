import { Long } from "@mtcute/core";
import { Hono } from "hono";
import { botManager } from "../../bot-manager";
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

    const { workspaceId, chatId, text } = result.data;

    const client = botManager.getClient(workspaceId);
    if (!client) {
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }

    // Try to resolve peer from cache first
    type LongType = InstanceType<typeof Long>;
    type InputPeer =
      | Awaited<ReturnType<typeof client.resolvePeer>>
      | { _: "inputPeerChannel"; channelId: number; accessHash: LongType }
      | { _: "inputPeerChat"; chatId: number }
      | { _: "inputPeerUser"; userId: number; accessHash: LongType };

    let peer: InputPeer | undefined;
    try {
      peer = await client.resolvePeer(chatId);
    } catch {
      // If not in cache, fetch from Telegram API
      const chatIdNum =
        typeof chatId === "string" ? Number.parseInt(chatId, 10) : chatId;

      // Try to get chat/user info from Telegram
      try {
        const chats = await client.call({
          _: "messages.getChats",
          id: [chatIdNum],
        });

        if (chats.chats && chats.chats.length > 0) {
          const chat = chats.chats[0];
          if (chat && chat._ === "chat") {
            peer = {
              _: "inputPeerChat",
              chatId: chat.id,
            };
          } else if (chat && chat._ === "channel" && "accessHash" in chat) {
            peer = {
              _: "inputPeerChannel",
              channelId: chat.id,
              accessHash: chat.accessHash || Long.ZERO,
            };
          }
        }
      } catch {
        // If getChats fails, try as user
        try {
          const users = await client.call({
            _: "users.getUsers",
            id: [
              {
                _: "inputUser",
                userId: chatIdNum,
                accessHash: Long.ZERO,
              },
            ],
          });
          if (users && users.length > 0) {
            const user = users[0];
            if (
              user &&
              user._ === "user" &&
              "accessHash" in user &&
              user.accessHash
            ) {
              peer = {
                _: "inputPeerUser",
                userId: user.id,
                accessHash: user.accessHash,
              };
            }
          }
        } catch {
          // Ignore user lookup errors
        }
      }

      if (!peer) {
        return c.json({ error: `Chat ${chatId} not found` }, 404);
      }
    }

    const messageResult = await client.sendText(peer, text);

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

messages.post("/send-by-username", async (c) => {
  try {
    const body = await c.req.json();
    console.log("📥 /send-by-username received body:", JSON.stringify(body));

    const result = sendMessageByUsernameSchema.safeParse(body);
    if (!result.success) {
      console.error("❌ Validation failed:", result.error.issues);
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { workspaceId, username, text } = result.data;
    console.log("✅ Validated data:", {
      workspaceId,
      username,
      textLength: text.length,
    });

    const client = botManager.getClient(workspaceId);
    if (!client) {
      console.error(`❌ Bot not running for workspace ${workspaceId}`);
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }
    const cleanedUsername = cleanUsername(username);
    const messageResult = await client.sendText(cleanedUsername, text);

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
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

    const { workspaceId, phone, text, firstName } = result.data;

    const client = botManager.getClient(workspaceId);
    if (!client) {
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }

    if (!phone.startsWith("+")) {
      return c.json({ error: "Phone must be in international format" }, 400);
    }

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

    const inputPeer = {
      _: "inputPeerUser" as const,
      userId: user.id,
      accessHash: user.accessHash || Long.ZERO,
    };

    const messageResult = await client.sendText(inputPeer, text);

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

export default messages;
