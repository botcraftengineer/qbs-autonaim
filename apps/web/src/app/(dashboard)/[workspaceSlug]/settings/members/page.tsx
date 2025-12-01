import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { WorkspaceMembersClient } from "~/components/settings/workspace-members-client";
import { api } from "~/trpc/server";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Получаем workspace по slug
  const caller = await api();
  const workspaceData = await caller.workspace.bySlug({ slug: workspaceSlug });

  return (
    <WorkspaceMembersClient
      workspaceId={workspaceData.workspace.id}
      currentUserId={session.user.id}
    />
  );
}
