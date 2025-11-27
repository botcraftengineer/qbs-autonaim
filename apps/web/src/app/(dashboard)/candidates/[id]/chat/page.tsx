import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { SiteHeader } from "~/components/layout";
import { ChatContainer } from "~/components/chat";
import type { ChatMessageProps, MessageSender } from "~/components/chat";
import { api } from "~/trpc/server";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  // Получаем отклик кандидата
  const response = await (api as any).vacancy.responses.getById({ id });

  if (!response) {
    notFound();
  }

  // Получаем беседу
  const conversation = await (api as any).telegram?.conversation
    ?.getByResponseId?.({
      responseId: id,
    })
    .catch(() => null);

  let messages: ChatMessageProps[] = [];

  if (conversation) {
    // Получаем сообщения из беседы
    const telegramMessages = await (api as any).telegram.messages
      .getByConversationId({
        conversationId: conversation.id,
      })
      .catch(() => []);

    messages = telegramMessages.map(
      (msg: {
        id: string;
        sender: string;
        content: string;
        createdAt: Date;
      }) => ({
        id: msg.id,
        sender: msg.sender.toLowerCase() as MessageSender,
        content: msg.content,
        timestamp: msg.createdAt,
        senderName:
          msg.sender === "CANDIDATE"
            ? (response.candidateName ?? undefined)
            : undefined,
      })
    );
  }

  const handleSendMessage = async (message: string) => {
    "use server";

    if (!conversation) {
      throw new Error("Беседа не найдена");
    }

    await (api as any).telegram.sendMessage.send({
      conversationId: conversation.id,
      sender: "ADMIN",
      contentType: "TEXT",
      content: message,
    });

    revalidatePath(`/candidates/${id}/chat`);
  };

  return (
    <>
      <SiteHeader title="Чат с кандидатом" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {!conversation ? (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">
                      Беседа не найдена
                    </h2>
                    <p className="text-muted-foreground">
                      Для этого кандидата еще нет активной беседы
                    </p>
                  </div>
                </div>
              ) : (
                <ChatContainer
                  candidateName={response.candidateName ?? "Кандидат"}
                  candidateEmail={
                    typeof response.contacts === "object" &&
                    response.contacts &&
                    "email" in response.contacts
                      ? String(response.contacts.email)
                      : undefined
                  }
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  className="h-[calc(100vh-200px)]"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
