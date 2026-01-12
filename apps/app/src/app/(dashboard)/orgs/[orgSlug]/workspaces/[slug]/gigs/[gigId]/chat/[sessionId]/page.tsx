import { GigChatView } from "../gig-chat-view";

interface PageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
    gigId: string;
    sessionId: string;
  }>;
}

export default async function GigChatSessionPage({ params }: PageProps) {
  const { gigId, sessionId } = await params;

  return <GigChatView gigId={gigId} sessionId={sessionId} />;
}
