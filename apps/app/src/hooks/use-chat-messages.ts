"use client";

import { useEffect, useState } from "react";
import { useScrollToBottom } from "./use-scroll-to-bottom";

type ChatStatus = "idle" | "submitted" | "streaming" | "error";

/**
 * Хук для управления сообщениями чата с автопрокруткой
 * Адаптирован из ai-chatbot
 */
export function useChatMessages({ status }: { status: ChatStatus }) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
