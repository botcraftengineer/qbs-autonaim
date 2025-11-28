"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatError } from "~/components/chat/chat-error";
import { ChatHeader } from "~/components/chat/chat-header";
import { ChatInput } from "~/components/chat/chat-input";
import { ChatLoading } from "~/components/chat/chat-loading";
import { ChatMessages } from "~/components/chat/chat-messages";
import { ChatSidebar } from "~/components/chat/sidebar/chat-sidebar";
import { useTRPC } from "~/trpc/react";

export function ChatView({ conversationId }: { conversationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const conversationQueryOptions =
    trpc.telegram.conversation.getById.queryOptions({
      id: conversationId,
    });
  const { data: currentConversation } = useQuery(conversationQueryOptions);

  const metadata = currentConversation?.metadata
    ? JSON.parse(currentConversation.metadata)
    : null;
  const candidateResponseId = metadata?.responseId;

  const responseQueryOptions = trpc.vacancy.responses.getById.queryOptions({
    id: candidateResponseId ?? "",
  });
  const { data: responseData } = useQuery({
    ...responseQueryOptions,
    enabled: !!candidateResponseId,
  });

  const {
    data: messages = [],
    isPending,
    error,
  } = useQuery({
    ...trpc.telegram.messages.getByConversationId.queryOptions({
      conversationId,
    }),
    enabled: !!conversationId,
  });

  const sendMessageMutationOptions =
    trpc.telegram.sendMessage.send.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            ["telegram", "messages", "getByConversationId"],
            { input: { conversationId }, type: "query" },
          ],
        });
      },
    });

  const { mutate: sendMessage, isPending: isSending } = useMutation(
    sendMessageMutationOptions,
  );

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !conversationId) return;

    sendMessage({
      conversationId,
      sender: "ADMIN",
      contentType: "TEXT",
      content: message,
    });
  };

  if (isPending) {
    return <ChatLoading />;
  }

  if (error || !currentConversation) {
    return <ChatError message={error?.message} />;
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1">
        <ChatHeader
          candidateName={currentConversation.candidateName}
          chatId={currentConversation.chatId}
        />

        <ChatMessages
          messages={messages}
          candidateName={currentConversation.candidateName}
        />

        <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
      </div>

      <ChatSidebar
        candidateName={currentConversation.candidateName}
        chatId={currentConversation.chatId}
        responseData={responseData}
      />
    </div>
  );
}
