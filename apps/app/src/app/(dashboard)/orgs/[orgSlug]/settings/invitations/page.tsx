import { db, OrganizationRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";

const organizationRepository = new OrganizationRepository(db);

import { OrganizationInvitationsClient } from "~/components/organization";

export default async function OrganizationInvitationsPage({
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

  // Проверка прав (только owner/admin могут просматривать приглашения)
  if (access.role !== "owner" && access.role !== "admin") {
    redirect("/access-denied");
  }

  return <OrganizationInvitationsClient organizationId={organization.id} />;
}
