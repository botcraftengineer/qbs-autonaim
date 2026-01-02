import { SidebarInset, SidebarProvider } from "@qbs-autonaim/ui";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { GettingStartedWidget } from "~/components/getting-started/getting-started-widget";
import { AppSidebarWrapper } from "~/components/sidebar";
import { WorkspaceProvider } from "~/contexts/workspace-context";
import { api } from "~/trpc/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Редирект на /auth/signin обрабатывается в middleware
  if (!session?.user) {
    return null;
  }

  const caller = await api();
  const [userWorkspaces, userOrganizations] = await Promise.all([
    caller.workspace.list(),
    caller.organization.list(),
  ]);

  // Если нет workspaces, редирект на создание
  // (логика с приглашениями обрабатывается на странице /invite/[token])
  if (userWorkspaces.length === 0) {
    redirect("/onboarding");
  }

  // Преобразуем данные для компонента
  const workspaces = userWorkspaces.map((uw) => ({
    id: uw.workspace.id,
    name: uw.workspace.name,
    slug: uw.workspace.slug,
    logo: uw.workspace.logo,
    role: uw.role,
    organizationSlug: uw.workspace.organization?.slug,
    organizationId: uw.workspace.organizationId,
  }));

  const organizations = userOrganizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    role: (org as typeof org & { role: "owner" | "admin" | "member" }).role,
    memberCount: (org as typeof org & { memberCount: number }).memberCount,
    workspaceCount: (org as typeof org & { workspaceCount: number })
      .workspaceCount,
  }));

  return (
    <WorkspaceProvider workspaces={workspaces} organizations={organizations}>
      <SidebarProvider>
        <AppSidebarWrapper
          user={{
            name: session.user.name,
            email: session.user.email,
            avatar: session.user.image || "",
          }}
        />
        <SidebarInset>{children}</SidebarInset>
        <GettingStartedWidget />
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
