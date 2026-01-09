import { GigDetailClient } from "./gig-detail-client";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

export default async function GigDetailPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = await params;

  return (
    <GigDetailClient
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      gigId={gigId}
    />
  );
}
