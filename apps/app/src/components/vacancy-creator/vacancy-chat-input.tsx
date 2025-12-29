"use client";

import { Button, Textarea } from "@qbs-autonaim/ui";
import { Send } from "lucide-react";
import { useState } from "react";

interface VacancyChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function VacancyChatInput({
  onSendMessage,
  disabled = false,
}: VacancyChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опишите требования к вакансии…"
          disabled={disabled}
          className="min-h-[80px] resize-none pr-12 text-base"
          style={{ fontSize: "16px" }}
          autoComplete="off"
          spellCheck
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full"
          aria-label="Отправить сообщение"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        ⌘/Ctrl + Enter для отправки
      </p>
    </div>
  );
}
