"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@qbs-autonaim/ui";
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
import { useWorkspaces } from "~/contexts/workspace-context";

const getNavData = (orgSlug?: string, workspaceSlug?: string) => ({
  navMain: [
    {
      title: "Панель управления",
      url:
        orgSlug && workspaceSlug
          ? paths.workspace.root(orgSlug, workspaceSlug)
          : paths.dashboard.root,
      icon: IconDashboard,
    },
    {
      title: "Вакансии",
      url:
        orgSlug && workspaceSlug
          ? paths.workspace.vacancies(orgSlug, workspaceSlug)
          : "/vacancies",
      icon: IconFileDescription,
    },
    {
      title: "Кандидаты",
      url:
        orgSlug && workspaceSlug
          ? paths.workspace.candidates(orgSlug, workspaceSlug)
          : "/candidates",
      icon: IconUsersGroup,
    },
    {
      title: "Воронка найма",
      url:
        orgSlug && workspaceSlug
          ? paths.workspace.funnel(orgSlug, workspaceSlug)
          : "/funnel",
      icon: IconInnerShadowTop,
    },
    {
      title: "Чаты",
      url:
        orgSlug && workspaceSlug
          ? paths.workspace.chat(orgSlug, workspaceSlug)
          : "/chat",
      icon: IconMessage,
    },
  ],
  navSecondary: [
    {
      title: "Настройки",
      url:
        orgSlug && workspaceSlug
          ? paths.workspace.settings.root(orgSlug, workspaceSlug)
          : "/settings",
      icon: IconSettings,
    },
  ],
});

export function AppSidebar({
  user,
  activeWorkspaceId,
  onWorkspaceChangeAction,
  activeOrganizationId,
  onOrganizationChangeAction,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  activeWorkspaceId?: string;
  onWorkspaceChangeAction?: (workspaceId: string) => void;
  activeOrganizationId?: string;
  onOrganizationChangeAction?: (organizationId: string) => void;
}) {
  const { workspaces, organizations } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId);
  const data = getNavData(
    activeWorkspace?.organizationSlug,
    activeWorkspace?.slug,
  );

  return (
    <Sidebar variant="floating" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link
                href={
                  activeWorkspace?.organizationSlug && activeWorkspace?.slug
                    ? paths.workspace.root(
                        activeWorkspace.organizationSlug,
                        activeWorkspace.slug,
                      )
                    : paths.dashboard.root
                }
              >
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">QBS Автонайм</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {workspaces && workspaces.length > 0 && organizations && (
          <WorkspaceSwitcher
            activeWorkspaceId={activeWorkspaceId}
            activeOrganizationId={activeOrganizationId}
            onWorkspaceChangeAction={onWorkspaceChangeAction}
            onOrganizationChangeAction={onOrganizationChangeAction}
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
