"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@qbs-autonaim/ui";
import { paths } from "@qbs-autonaim/config";
import {
  IconDashboard,
  IconFileDescription,
  IconInnerShadowTop,
  IconMessage,
  IconSettings,
  IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import type * as React from "react";
import {
  NavMain,
  NavSecondary,
  NavUser,
  WorkspaceSwitcher,
} from "~/components/sidebar";

const getNavData = (workspaceSlug?: string) => ({
  navMain: [
    {
      title: "Панель управления",
      url: workspaceSlug ? paths.workspace.root(workspaceSlug) : paths.dashboard.root,
      icon: IconDashboard,
    },
    {
      title: "Вакансии",
      url: workspaceSlug ? paths.workspace.vacancies(workspaceSlug) : "/vacancies",
      icon: IconFileDescription,
    },
    {
      title: "Кандидаты",
      url: workspaceSlug ? paths.workspace.candidates(workspaceSlug) : "/candidates",
      icon: IconUsersGroup,
    },
    {
      title: "Воронка найма",
      url: workspaceSlug ? paths.workspace.funnel(workspaceSlug) : "/funnel",
      icon: IconInnerShadowTop,
    },
    {
      title: "Чаты",
      url: workspaceSlug ? paths.workspace.chat(workspaceSlug) : "/chat",
      icon: IconMessage,
    },
  ],
  navSecondary: [
    {
      title: "Настройки",
      url: workspaceSlug ? paths.workspace.settings.root(workspaceSlug) : "/settings",
      icon: IconSettings,
    },
  ],
});

type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
};

export function AppSidebar({
  user,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  workspaces?: WorkspaceWithRole[];
  activeWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}) {
  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId);
  const data = getNavData(activeWorkspace?.slug);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href={activeWorkspace ? paths.workspace.root(activeWorkspace.slug) : paths.dashboard.root}>
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">QBS Автонайм</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {workspaces && workspaces.length > 0 && (
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={onWorkspaceChange}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
