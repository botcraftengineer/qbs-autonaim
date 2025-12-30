/**
 * Типы для AI чата
 * Адаптированы из ai-chatbot
 */

export type MessageRole = "user" | "assistant" | "system";

export type MessagePartType =
  | "text"
  | "reasoning"
  | "file"
  | "tool-call"
  | "tool-result";

export interface TextPart {
  type: "text";
  text: string;
}

export interface ReasoningPart {
  type: "reasoning";
  text: string;
}

export interface FilePart {
  type: "file";
  url: string;
  filename?: string;
  mediaType: string;
}

export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
}

export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  result: unknown;
}

export type MessagePart =
  | TextPart
  | ReasoningPart
  | FilePart
  | ToolCallPart
  | ToolResultPart;

export interface AIChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export type ChatStatus = "idle" | "submitted" | "streaming" | "error";

/**
 * Конвертация legacy сообщений в новый формат
 */
export function convertLegacyMessage(message: {
  id: string;
  sender: "BOT" | "CANDIDATE" | "ADMIN";
  content: string;
  contentType: "TEXT" | "VOICE";
  createdAt: Date;
  voiceTranscription?: string | null;
  fileUrl?: string | null;
}): AIChatMessage {
  const role: MessageRole =
    message.sender === "CANDIDATE" ? "user" : "assistant";

  const parts: MessagePart[] = [];

  if (message.contentType === "VOICE" && message.fileUrl) {
    parts.push({
      type: "file",
      url: message.fileUrl,
      mediaType: "audio/ogg",
    });
    if (message.voiceTranscription) {
      parts.push({
        type: "text",
        text: message.voiceTranscription,
      });
    }
  } else {
    parts.push({
      type: "text",
      text: message.content,
    });
  }

  return {
    id: message.id,
    role,
    parts,
    createdAt: message.createdAt,
  };
}

/**
 * Извлечение текста из сообщения
 */
export function getMessageText(message: AIChatMessage): string {
  return message.parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

/**
 * Проверка наличия reasoning в сообщении
 */
export function hasReasoning(message: AIChatMessage): boolean {
  return message.parts.some((part) => part.type === "reasoning");
}

/**
 * Получение reasoning из сообщения
 */
export function getReasoningText(message: AIChatMessage): string | null {
  const reasoningPart = message.parts.find(
    (part): part is ReasoningPart => part.type === "reasoning",
  );
  return reasoningPart?.text ?? null;
}
