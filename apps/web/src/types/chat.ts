export interface ChatMessageProps {
  id: string;
  sender: "ADMIN" | "BOT" | "CANDIDATE";
  contentType: string;
  content: string;
  createdAt: Date;
  candidateName: string | null;
  fileUrl?: string | null;
  fileId?: string | null;
  voiceTranscription?: string | null;
  onTranscribe?: (messageId: string, fileId: string) => void;
  isTranscribing?: boolean;
  timestamp?: Date;
}
