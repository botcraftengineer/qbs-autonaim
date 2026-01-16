import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import type { DemoUserIds } from "../types";

interface ChatSessionData {
  entityType: "gig" | "vacancy" | "project" | "team";
  entityId: string;
  userId: string;
  title?: string;
  status?: "active" | "archived" | "blocked";
  messageCount?: number;
  metadata?: unknown;
  lastMessageAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ChatMessageData {
  sessionId: string;
  userId: string;
  role: "user" | "assistant" | "system" | "admin";
  type: "text" | "file" | "event";
  content: string;
  metadata?: unknown;
  quickReplies?: string[];
  createdAt?: string | null;
}

interface InsertedChatSession {
  id: string;
  title: string | null;
}

interface InsertedChatMessage {
  id: string;
  role: string;
}

export interface ChatSessionMapping {
  [oldId: string]: string;
}

function readJsonSafe<T>(path: string, fallback: T): T {
  try {
    const content = readFileSync(path, "utf-8").trim();
    return content ? JSON.parse(content) : fallback;
  } catch {
    return fallback;
  }
}

function createUserIdMapping(userIds: DemoUserIds): Record<string, string> {
  return {
    user_recruiter_001: userIds.recruiterId,
    user_recruiter_002: userIds.recruiterId,
    user_manager_001: userIds.managerId,
    user_client_001: userIds.clientId,
    user_freelancer_001: userIds.clientId,
    ai_assistant: userIds.recruiterId,
  };
}

export async function loadChatSessions(
  userIds: DemoUserIds,
  vacancyIds: string[],
  gigIds: string[],
): Promise<{
  sessions: InsertedChatSession[];
  sessionMapping: ChatSessionMapping;
}> {
  console.log("\n👥 Загружаем чат-сессии...");

  const { chatSession } = await import("@qbs-autonaim/db/schema");

  const sessionsPath = join(__dirname, "../../data/chat-sessions.json");
  const sessionsData = readJsonSafe<ChatSessionData[]>(sessionsPath, []);

  console.log(`👥 Найдено ${sessionsData.length} чат-сессий`);

  if (
    sessionsData.length === 0 ||
    (vacancyIds.length === 0 && gigIds.length === 0)
  ) {
    console.log("⚠️  Нет данных чат-сессий для загрузки");
    return { sessions: [], sessionMapping: {} };
  }

  const userIdMapping = createUserIdMapping(userIds);

  const updatedSessions = sessionsData
    .map((session, index) => {
      const entityId =
        session.entityType === "vacancy"
          ? vacancyIds[index % vacancyIds.length]
          : gigIds[index % gigIds.length];

      if (!entityId) return null;

      return {
        entityType: session.entityType,
        entityId,
        userId: userIdMapping[session.userId] || userIds.recruiterId,
        title: session.title,
        status: session.status,
        messageCount: session.messageCount,
        metadata: (session.metadata as Record<string, unknown>) || null,
        lastMessageAt: session.lastMessageAt
          ? new Date(session.lastMessageAt)
          : null,
        createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
        updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (updatedSessions.length === 0) {
    console.log("⚠️  Нет валидных чат-сессий для загрузки");
    return { sessions: [], sessionMapping: {} };
  }

  const sessions = await db
    .insert(chatSession)
    .values(updatedSessions)
    .returning({ id: chatSession.id, title: chatSession.title });

  console.log("✅ Чат-сессии загружены:");
  for (const s of sessions) {
    console.log(`  - ${s.title || "Чат"} (ID: ${s.id})`);
  }

  const sessionMapping: ChatSessionMapping = {};
  if (sessions.length > 0) {
    sessionMapping.chat_session_001 = sessions[0]?.id || "";
    sessionMapping.chat_session_002 = sessions[1]?.id || "";
    sessionMapping.chat_session_003 = sessions[2]?.id || "";
  }

  return { sessions, sessionMapping };
}

export async function loadChatMessages(
  userIds: DemoUserIds,
  sessionMapping: ChatSessionMapping,
  fallbackSessionId: string,
): Promise<InsertedChatMessage[]> {
  console.log("\n📝 Загружаем сообщения чатов...");

  const { chatMessage } = await import("@qbs-autonaim/db/schema");

  const messagesPath = join(__dirname, "../../data/chat-messages.json");
  const messagesData = readJsonSafe<ChatMessageData[]>(messagesPath, []);

  console.log(`📝 Найдено ${messagesData.length} сообщений чатов`);

  if (messagesData.length === 0 || !fallbackSessionId) {
    console.log("⚠️  Нет данных сообщений чатов для загрузки");
    return [];
  }

  const userIdMapping = createUserIdMapping(userIds);

  const updatedMessages = messagesData
    .map((msg) => {
      const mappedSessionId =
        sessionMapping[msg.sessionId] || fallbackSessionId;
      if (!mappedSessionId) return null;

      return {
        sessionId: mappedSessionId,
        userId: userIdMapping[msg.userId] || userIds.recruiterId,
        role: msg.role,
        type: msg.type,
        content: msg.content,
        metadata: (msg.metadata as Record<string, unknown>) || null,
        quickReplies: msg.quickReplies,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (updatedMessages.length === 0) {
    console.log("⚠️  Нет валидных сообщений чатов для загрузки");
    return [];
  }

  const messages = await db
    .insert(chatMessage)
    .values(updatedMessages)
    .returning({ id: chatMessage.id, role: chatMessage.role });

  console.log(`✅ Загружено ${messages.length} сообщений чатов`);

  return messages;
}
