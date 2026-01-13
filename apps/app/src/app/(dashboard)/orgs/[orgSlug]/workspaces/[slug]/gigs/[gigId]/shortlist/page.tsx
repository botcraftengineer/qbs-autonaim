import { ShortlistPageClient } from "./shortlist-page-client";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

export default async function ShortlistPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = await params;

  return (
    <ShortlistPageClient
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      gigId={gigId}
    />
  );
}