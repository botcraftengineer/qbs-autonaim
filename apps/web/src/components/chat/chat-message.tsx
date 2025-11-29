import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ChatMessageProps } from "../../types/chat";
import { VoicePlayer } from "./voice-player";

export function ChatMessage({
  id,
  sender,
  contentType,
  content,
  createdAt,
  candidateName,
  fileUrl,
  fileId,
  voiceTranscription,
  onTranscribe,
  isTranscribing = false,
}: ChatMessageProps) {
  const isAdmin = sender === "ADMIN";
  const isBot = sender === "BOT";
  const isVoice = contentType === "VOICE";

  const senderLabel = isAdmin
    ? "Вы"
    : isBot
      ? "Бот"
      : (candidateName ?? "Кандидат");

  const bgColor = isAdmin
    ? "bg-teal-600 text-white"
    : isBot
      ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50"
      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100";

  const timeColor = isAdmin
    ? "text-teal-200"
    : isBot
      ? "text-blue-700 dark:text-blue-300"
      : "text-gray-500 dark:text-gray-400";

  const borderColor = isAdmin
    ? "border-teal-500/30"
    : isBot
      ? "border-blue-300/50 dark:border-blue-700/50"
      : "border-gray-300/50 dark:border-gray-600/50";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${bgColor}`}>
        <p className="text-xs font-semibold mb-1 opacity-80">{senderLabel}</p>
        {isVoice && fileUrl ? (
          <div className="space-y-2">
            <VoicePlayer
              src={fileUrl}
              isOutgoing={isAdmin}
              messageId={id}
              fileId={fileId ?? undefined}
              hasTranscription={!!voiceTranscription}
              onTranscribe={
                fileId && onTranscribe
                  ? () => onTranscribe(id, fileId)
                  : undefined
              }
              isTranscribing={isTranscribing}
            />
            {voiceTranscription && (
              <div
                className={`text-xs leading-relaxed pt-2 border-t ${borderColor}`}
              >
                <p className="opacity-70 mb-1 font-medium">Транскрипция:</p>
                <p className="opacity-90">{voiceTranscription}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        )}
        <p className={`text-xs mt-1 ${timeColor}`}>
          {format(createdAt, "HH:mm", { locale: ru })}
        </p>
      </div>
    </div>
  );
}
