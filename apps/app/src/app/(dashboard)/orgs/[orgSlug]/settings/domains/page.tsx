import { paths } from "@qbs-autonaim/config";
import { db, OrganizationRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { SiteHeader } from "~/components/layout";
import { CustomDomainsSection } from "~/components/organization";

const organizationRepository = new OrganizationRepository(db);

export default async function OrganizationDomainsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const { orgSlug } = await params;

  const organization = await organizationRepository.findBySlug(orgSlug);
  if (!organization) {
    redirect(paths.dashboard.root);
  }

  const access = await organizationRepository.checkAccess(
    organization.id,
    session.user.id,
  );

  if (!access) {
    redirect(paths.accessDenied);
  }

  return (
    <>
      <SiteHeader />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl pl-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              Кастомные домены
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Управляйте доменами для ссылок на интервью
            </p>
          </div>
          <CustomDomainsSection organizationId={organization.id} />
        </div>
      </div>
    </>
  );
}
