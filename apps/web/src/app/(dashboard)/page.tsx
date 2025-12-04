import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { api } from "~/trpc/server";

export default async function Page() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const caller = await api();

  // Проверяем наличие pending invitations
  const pendingInvites = await caller.workspace.getPendingInvites();
  if (pendingInvites.length > 0) {
    redirect("/invitations");
  }

  // Получаем workspaces пользователя
  const userWorkspaces = await caller.workspace.list();

  // Редирект на первый workspace
  const firstWorkspace = userWorkspaces[0];
  if (firstWorkspace) {
    redirect(`/${firstWorkspace.workspace.slug}`);
  }

  // Если нет workspaces, редирект на создание
  redirect("/onboarding");
}
