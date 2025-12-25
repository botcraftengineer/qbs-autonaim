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

  // Получаем данные пользователя с последним активным воркспейсом
  const userData = await caller.user.me();

  // Если есть последний активный воркспейс, проверяем доступ перед редиректом
  if (userData?.lastActiveWorkspace && userData?.lastActiveOrganization) {
    const accessCheck = await caller.user.checkWorkspaceAccess({
      organizationId: userData.lastActiveOrganization.id,
      workspaceId: userData.lastActiveWorkspace.id,
    });

    if (accessCheck.hasAccess) {
      redirect(
        `/orgs/${userData.lastActiveOrganization.slug}/workspaces/${userData.lastActiveWorkspace.slug}`,
      );
    }

    // Если доступ отсутствует, очищаем lastActive поля
    await caller.user.clearActiveWorkspace();
  }

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
