import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InterviewChat } from "~/components/interview-chat";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sessionId?: string }>;
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
  const { sessionId } = await searchParams;

  if (!sessionId) {
    redirect(`/${token}`);
  }

  return (
    <main className="flex h-screen flex-col bg-muted/30">
      <InterviewChat interviewSessionId={sessionId} interviewToken={token} />
    </main>
  );
}
