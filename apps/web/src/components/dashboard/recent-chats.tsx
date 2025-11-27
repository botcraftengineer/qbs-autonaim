import { ChatPreviewCard } from "~/components/chat";
import { api } from "~/trpc/server";

export async function RecentChats() {
  // Получаем последние сообщения
  const recentMessages = await api.telegram.messages.getRecent({ limit: 5 });

  // Группируем по беседам и берем последнее сообщение из каждой
  const conversationMap = new Map();

  for (const message of recentMessages) {
    if (!conversationMap.has(message.conversationId)) {
      conversationMap.set(message.conversationId, {
        conversation: message.conversation,
        lastMessage: message,
        messageCount: 1,
      });
    }
  }

  const chats = Array.from(conversationMap.values());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Последние чаты</h2>
      </div>

      <div className="grid gap-3">
        {chats.map(({ conversation, lastMessage }) => (
          <ChatPreviewCard
            key={conversation.id}
            candidateId={conversation.id}
            candidateName={conversation.candidateName ?? "Кандидат"}
            lastMessage={lastMessage.content}
            lastMessageTime={lastMessage.createdAt}
            messageCount={0} // TODO: Добавить подсчет сообщений
            unreadCount={0} // TODO: Добавить подсчет непрочитанных
            status={conversation.status === "ACTIVE" ? "active" : "completed"}
          />
        ))}
      </div>

      {chats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет активных чатов</p>
        </div>
      )}
    </div>
  );
}
