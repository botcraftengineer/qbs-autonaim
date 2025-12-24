import { db, OrganizationRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";

const organizationRepository = new OrganizationRepository(db);

import { WorkspaceListClient } from "~/components/workspace/workspace-list-client";

export default async function WorkspacesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { orgSlug } = await params;

  const organization = await organizationRepository.findBySlug(orgSlug);
  if (!organization) {
    redirect("/");
  }

  const access = await organizationRepository.checkAccess(
    organization.id,
    session.user.id,
  );

  if (!access) {
    redirect("/access-denied");
  }

  const workspaces = await organizationRepository.getWorkspaces(
    organization.id,
  );

  return (
    <WorkspaceListClient
      organizationId={organization.id}
      organizationSlug={organization.slug}
      initialWorkspaces={workspaces}
      userRole={access.role}
    />
  );
}
