"use client";

import { Button, cn } from "@qbs-autonaim/ui";
import { Loader2, Paperclip, Send, Square } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChatStatus } from "~/types/ai-chat";

interface AIChatInputProps {
  onSendMessage: (message: string) => void;
  onStop?: () => void;
  status: ChatStatus;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showAttachments?: boolean;
  onAttach?: () => void;
}

/**
 * Компонент ввода для AI чата
 * Адаптирован из ai-chatbot multimodal-input.tsx
 */
function PureAIChatInput({
  onSendMessage,
  onStop,
  status,
  disabled = false,
  placeholder = "Напишите сообщение…",
  className,
  showAttachments = false,
  onAttach,
}: AIChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const isDisabled = disabled || (isLoading && !onStop);

  // Автофокус на десктопе
  useEffect(() => {
    if (textareaRef.current && window.innerWidth > 768) {
      textareaRef.current.focus();
    }
  }, []);

  // Авторесайз textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: input нужен для пересчёта высоты
  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isDisabled) return;

    onSendMessage(trimmedInput);
    setInput("");

    // Сброс высоты
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter отправляет, Shift+Enter — новая строка
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    onStop?.();
  };

  return (
    <div
      className={cn(
        "border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
        className,
      )}
    >
      <div className="p-2 md:p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className={cn(
              "w-full min-h-[50px] md:min-h-[60px] max-h-[200px] resize-none rounded-3xl",
              "border-2 bg-background px-4 py-3 md:py-4 text-sm md:text-base",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              showAttachments ? "pl-10 md:pl-12" : "pl-4",
              "pr-12 md:pr-14",
            )}
            style={{ touchAction: "manipulation" }}
            autoComplete="off"
            name="message"
            aria-label="Сообщение"
          />

          {/* Кнопка прикрепления */}
          {showAttachments && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-1 md:left-2 top-2 md:top-3 h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
              disabled={isDisabled}
              onClick={onAttach}
              aria-label="Прикрепить файл"
            >
              <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}

          {/* Кнопка отправки/остановки */}
          {isLoading && onStop ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute right-1 md:right-2 top-2 md:top-3 h-8 w-8 md:h-9 md:w-9 rounded-full"
              onClick={handleStop}
              aria-label="Остановить генерацию"
            >
              <Square className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="absolute right-1 md:right-2 top-2 md:top-3 h-8 w-8 md:h-9 md:w-9 rounded-full"
              disabled={!input.trim() || isDisabled}
              onClick={handleSubmit}
              aria-label="Отправить сообщение"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Подсказка */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter — отправить, Shift+Enter — новая строка
        </p>
      </div>
    </div>
  );
}

export const AIChatInput = memo(PureAIChatInput);
