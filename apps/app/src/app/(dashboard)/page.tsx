import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

export default async function Page() {
  const session = await getSession();

  // Редирект на /auth/signin обрабатывается в proxy
  if (!session?.user) {
    return null;
  }

  const caller = await api();

  // Получаем workspaces пользователя
  const userWorkspaces = await caller.workspace.list();

  // Если есть workspaces, редирект на первый
  const firstWorkspace = userWorkspaces[0];
  if (firstWorkspace) {
    redirect(
      `/orgs/${firstWorkspace.workspace.organization?.slug}/workspaces/${firstWorkspace.workspace.slug}`,
    );
  }

  // Проверяем наличие pending invitations
  const pendingInvites = await caller.workspace.invites.pending();
  if (pendingInvites.length > 0) {
    redirect("/invitations");
  }

  // Если нет workspaces и нет приглашений, редирект на создание
  redirect("/onboarding");
}
