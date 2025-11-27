"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@selectio/ui";
import { Smile, Paperclip, Mic, Send } from "lucide-react";
import { cn } from "@selectio/ui";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Сообщение",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
    >
      {/* Emoji button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Smile className="h-6 w-6" />
      </Button>

      {/* Input container */}
      <div className="flex-1 flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-2">
        {/* Attach button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent resize-none outline-none",
            "text-[15px] leading-[1.4] max-h-[120px]",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      </div>

      {/* Send or Voice button */}
      {message.trim() ? (
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          size="icon"
          className="shrink-0 h-11 w-11 rounded-full bg-teal-500 hover:bg-teal-600 text-white"
        >
          <Send className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 h-11 w-11 rounded-full",
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          )}
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
          onMouseLeave={() => setIsRecording(false)}
        >
          <Mic className="h-6 w-6" />
        </Button>
      )}
    </form>
  );
}
