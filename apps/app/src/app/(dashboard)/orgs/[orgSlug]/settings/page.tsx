import { db, OrganizationRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { SiteHeader } from "~/components/layout";
import { OrganizationGeneralForm } from "~/components/organization";

const organizationRepository = new OrganizationRepository(db);

export default async function OrganizationSettingsPage({
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
      <SiteHeader title="Общие настройки" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl pl-8">
          <OrganizationGeneralForm
            initialData={{
              name: organization.name,
              slug: organization.slug,
              description: organization.description ?? undefined,
              website: organization.website ?? undefined,
              logo: organization.logo ?? undefined,
            }}
            organizationId={organization.id}
            userRole={access.role}
          />
        </div>
      </div>
    </>
  );
}
