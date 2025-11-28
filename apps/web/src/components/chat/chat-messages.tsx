import { ScrollArea } from "@selectio/ui";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";

interface Message {
  id: string;
  sender: "ADMIN" | "BOT" | "CANDIDATE";
  contentType: string;
  content: string;
  createdAt: Date;
  fileUrl?: string | null;
  voiceTranscription?: string | null;
}

interface ChatMessagesProps {
  messages: Message[];
  candidateName: string | null;
}

export function ChatMessages({ messages, candidateName }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  return (
    <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            sender={msg.sender}
            contentType={msg.contentType}
            content={msg.content}
            createdAt={msg.createdAt}
            candidateName={candidateName}
            fileUrl={msg.fileUrl}
            voiceTranscription={msg.voiceTranscription}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
