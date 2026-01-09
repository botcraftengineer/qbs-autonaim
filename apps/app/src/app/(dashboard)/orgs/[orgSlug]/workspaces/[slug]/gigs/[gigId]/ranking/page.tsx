import { RankingPageClient } from "./ranking-page-client";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

export default async function RankingPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = await params;

  return (
    <RankingPageClient
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      gigId={gigId}
    />
  );
}
