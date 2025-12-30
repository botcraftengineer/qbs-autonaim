"use client";

import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

/**
 * Типы данных для streaming чата
 */
export type StreamDataPart =
  | { type: "text-delta"; data: string }
  | { type: "thinking"; data: string }
  | { type: "tool-call"; data: { name: string; args: unknown } }
  | { type: "tool-result"; data: { name: string; result: unknown } }
  | { type: "error"; data: string }
  | { type: "finish"; data: null };

type ChatStreamContextValue = {
  dataStream: StreamDataPart[];
  setDataStream: React.Dispatch<React.SetStateAction<StreamDataPart[]>>;
  clearStream: () => void;
};

const ChatStreamContext = createContext<ChatStreamContextValue | null>(null);

/**
 * Провайдер для управления потоком данных чата
 * Адаптирован из ai-chatbot DataStreamProvider
 */
export function ChatStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<StreamDataPart[]>([]);

  const clearStream = () => setDataStream([]);

  const value = useMemo(
    () => ({ dataStream, setDataStream, clearStream }),
    [dataStream],
  );

  return (
    <ChatStreamContext.Provider value={value}>
      {children}
    </ChatStreamContext.Provider>
  );
}

export function useChatStream() {
  const context = useContext(ChatStreamContext);
  if (!context) {
    throw new Error("useChatStream must be used within a ChatStreamProvider");
  }
  return context;
}
