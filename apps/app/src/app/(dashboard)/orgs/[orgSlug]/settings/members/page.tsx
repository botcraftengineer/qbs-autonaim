import { db, OrganizationRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { SiteHeader } from "~/components/layout";

const organizationRepository = new OrganizationRepository(db);

import { OrganizationMembersClient } from "~/components/organization";

export default async function OrganizationMembersPage({
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

  return (
    <>
      <SiteHeader />
      <div className="container mx-auto py-8">
        <OrganizationMembersClient
          organizationId={organization.id}
          currentUserId={session.user.id}
          currentUserRole={access.role}
        />
      </div>
    </>
  );
}
