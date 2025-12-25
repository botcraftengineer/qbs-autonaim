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
    try {
      // Проверяем, что пользователь все еще имеет доступ к организации и воркспейсу
      await caller.organization.getWorkspaceBySlug({
        organizationId: userData.lastActiveOrganization.id,
        slug: userData.lastActiveWorkspace.slug,
      });

      // Если проверка прошла успешно, выполняем редирект
      redirect(
        `/orgs/${userData.lastActiveOrganization.slug}/workspaces/${userData.lastActiveWorkspace.slug}`,
      );
    } catch (error) {
      // Если доступ отсутствует, очищаем lastActive поля
      console.error(
        "Access check failed for lastActive workspace, clearing:",
        error,
      );

      try {
        await caller.user.setActiveWorkspace({
          organizationId: "",
          workspaceId: "",
        });
      } catch (updateError) {
        console.error("Failed to clear lastActive fields:", updateError);
      }

      // Продолжаем с обычным flow (не делаем редирект)
    }
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
