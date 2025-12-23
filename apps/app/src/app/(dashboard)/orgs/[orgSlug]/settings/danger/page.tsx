import { organizationRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { DangerZoneSection } from "~/components/organization";

export default async function DangerZonePage({
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

  // Только владелец может удалять организацию
  if (access.role !== "owner") {
    return (
      <div className="rounded-lg border border-muted p-6">
        <p className="text-muted-foreground">
          Только владелец организации может удалить её. Обратитесь к владельцу
          для выполнения этого действия.
        </p>
      </div>
    );
  }

  return (
    <DangerZoneSection
      organizationId={organization.id}
      organizationName={organization.name}
    />
  );
}
