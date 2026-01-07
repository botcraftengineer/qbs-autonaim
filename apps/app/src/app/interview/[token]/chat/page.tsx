import { paths } from "@qbs-autonaim/config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InterviewChat } from "~/components/ai-chat";

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
    redirect(paths.interview(token));
  }

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      <InterviewChat conversationId={responseId} />
    </main>
  );
}
