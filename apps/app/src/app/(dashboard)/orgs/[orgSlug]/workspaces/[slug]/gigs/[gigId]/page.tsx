import { notFound } from "next/navigation";
import { api, HydrateClient, prefetch, trpc } from "~/trpc/server";
import { GigDetailClient } from "./gig-detail-client";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

export default async function GigDetailPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = await params;

  // Получаем организацию и workspace на сервере
  const caller = await api();
  const org = await caller.organization.getBySlug({ slug: orgSlug });

  if (!org) {
    notFound();
  }

  const workspaceData = await caller.workspace.getBySlug({
    slug: workspaceSlug,
    organizationId: org.id,
  });

  if (!workspaceData) {
    notFound();
  }

  // Prefetch данных gig на сервере
  prefetch(
    trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspaceData.workspace.id,
    }),
  );

  return (
    <HydrateClient>
      <GigDetailClient
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        gigId={gigId}
        workspaceId={workspaceData.workspace.id}
      />
    </HydrateClient>
  );
}
