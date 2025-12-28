import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WebChatInterface } from "./_components/web-chat-interface";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ responseId?: string }>;
}

export const metadata: Metadata = {
  title: "AI Интервью",
  description: "Чат с AI-ассистентом для прохождения интервью",
};

export default async function InterviewChatPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { responseId } = await searchParams;

  if (!responseId) {
    redirect(`/interview/${token}`);
  }

  // В реальном приложении здесь можно добавить проверку существования responseId
  // Но для упрощения пропустим это, так как проверка будет в компоненте

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      <WebChatInterface conversationId={responseId} token={token} />
    </main>
  );
}
