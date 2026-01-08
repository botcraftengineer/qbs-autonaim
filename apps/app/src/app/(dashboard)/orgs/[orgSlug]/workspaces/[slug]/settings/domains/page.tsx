import { paths } from "@qbs-autonaim/config";
import { db, WorkspaceRepository } from "@qbs-autonaim/db";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { CustomDomainsSection } from "~/components/workspace";

const workspaceRepository = new WorkspaceRepository(db);

export default async function WorkspaceDomainsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const { orgSlug, slug } = await params;

  const workspace = await workspaceRepository.findBySlug(orgSlug, slug);
  if (!workspace) {
    redirect(paths.dashboard.root);
  }

  const access = await workspaceRepository.checkAccess(
    workspace.id,
    session.user.id,
  );

  if (!access) {
    redirect(paths.accessDenied);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Кастомные домены</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Управляйте доменами для ссылок на интервью
        </p>
      </div>
      <CustomDomainsSection workspaceId={workspace.id} />
    </div>
  );
}
