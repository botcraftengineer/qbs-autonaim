"use client";

import { paths } from "@qbs-autonaim/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@qbs-autonaim/ui";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconPlus,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CreateOrganizationDialog } from "~/components/organization";
import { CreateWorkspaceDialog } from "~/components/workspace";

type WorkspaceWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  memberCount?: number;
  plan?: string;
  organizationSlug: string | undefined;
  organizationId: string | null;
};

type OrganizationWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  memberCount?: number;
  workspaceCount?: number;
};

export function WorkspaceSwitcher({
  workspaces,
  organizations,
  activeWorkspaceId,
  activeOrganizationId,
  onWorkspaceChangeAction,
  onOrganizationChangeAction,
}: {
  workspaces: WorkspaceWithRole[];
  organizations: OrganizationWithRole[];
  activeWorkspaceId?: string;
  activeOrganizationId?: string;
  onWorkspaceChangeAction?: (workspaceId: string) => void;
  onOrganizationChangeAction?: (organizationId: string) => void;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [activeWorkspace, setActiveWorkspace] = React.useState(
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0],
  );
  const [activeOrganization, setActiveOrganization] = React.useState(
    organizations.find((o) => o.id === activeOrganizationId) ??
      organizations[0],
  );
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);

  if (!activeWorkspace || !activeOrganization) {
    return null;
  }

  // Фильтруем workspace только текущей организации
  const currentOrgWorkspaces = workspaces.filter(
    (w) => w.organizationId === activeOrganization.id,
  );

  const handleWorkspaceChange = (workspace: WorkspaceWithRole) => {
    setActiveWorkspace(workspace);
    onWorkspaceChangeAction?.(workspace.id);

    if (!workspace.organizationSlug || !workspace.slug) {
      console.error(
        "Invalid workspace data: missing organizationSlug or slug",
        workspace,
      );
      return;
    }

    router.push(
      paths.workspace.root(workspace.organizationSlug, workspace.slug),
    );
  };

  const handleOrganizationChange = (organization: OrganizationWithRole) => {
    setActiveOrganization(organization);
    onOrganizationChangeAction?.(organization.id);
    router.push(paths.organization.workspaces(organization.slug));
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {activeOrganization.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={activeOrganization.logo}
                      alt={activeOrganization.name}
                      className="size-8 rounded-lg object-cover"
                    />
                  ) : (
                    <IconBuildingCommunity className="size-4" />
                  )}
                </div>
                <span className="text-muted-foreground">/</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeWorkspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeWorkspace.plan ?? "Бесплатный"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg border">
                  {activeWorkspace.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={activeWorkspace.logo}
                      alt={activeWorkspace.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <IconBriefcase className="size-5" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-sm">
                    {activeWorkspace.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {activeWorkspace.plan ?? "Бесплатный"} ·{" "}
                    {activeWorkspace.memberCount ?? 1}{" "}
                    {activeWorkspace.memberCount === 1
                      ? "участник"
                      : "участников"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  onClick={() => {
                    if (!activeWorkspace.organizationSlug) return;
                    router.push(
                      paths.workspace.settings.root(
                        activeWorkspace.organizationSlug,
                        activeWorkspace.slug,
                      ),
                    );
                  }}
                >
                  <IconSettings className="size-4" />
                  <span className="text-sm">Настройки</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  onClick={() => {
                    if (!activeWorkspace.organizationSlug) return;
                    router.push(
                      paths.workspace.settings.members(
                        activeWorkspace.organizationSlug,
                        activeWorkspace.slug,
                      ),
                    );
                  }}
                >
                  <IconUserPlus className="size-4" />
                  <span className="text-sm">Пригласить</span>
                </DropdownMenuItem>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Рабочие пространства
            </DropdownMenuLabel>
            {currentOrgWorkspaces.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceChange(workspace)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {workspace.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={workspace.logo}
                      alt={workspace.name}
                      className="size-6 rounded-md object-cover"
                    />
                  ) : (
                    <IconBriefcase className="size-3.5 shrink-0" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-sm">{workspace.name}</span>
                </div>
                {workspace.id === activeWorkspace.id && (
                  <div className="ml-auto size-2 rounded-full bg-primary" />
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setCreateDialogOpen(true)}
              disabled={
                !activeWorkspace.organizationId ||
                !activeWorkspace.organizationSlug
              }
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <IconPlus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Создать рабочее пространство
              </div>
            </DropdownMenuItem>
            {organizations.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <IconBuildingCommunity className="size-4" />
                    </div>
                    <div className="font-medium">Переключить организацию</div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-80">
                    <DropdownMenuLabel className="text-muted-foreground text-xs">
                      Организации
                    </DropdownMenuLabel>
                    {organizations.map((organization) => (
                      <DropdownMenuItem
                        key={organization.id}
                        onClick={() => handleOrganizationChange(organization)}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-md border">
                          {organization.logo ? (
                            // biome-ignore lint/performance/noImgElement: external URL from database
                            <img
                              src={organization.logo}
                              alt={organization.name}
                              className="size-6 rounded-md object-cover"
                            />
                          ) : (
                            <IconBuildingCommunity className="size-3.5 shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium text-sm">
                            {organization.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {organization.workspaceCount ?? 0}{" "}
                            {organization.workspaceCount === 1
                              ? "пространство"
                              : "пространств"}
                          </span>
                        </div>
                        {organization.id === activeOrganization.id && (
                          <div className="ml-auto size-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 p-2"
                      onClick={() => setCreateOrgDialogOpen(true)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                        <IconPlus className="size-4" />
                      </div>
                      <div className="text-muted-foreground font-medium">
                        Создать организацию
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {activeWorkspace.organizationId && activeWorkspace.organizationSlug && (
        <CreateWorkspaceDialog
          organizationId={activeWorkspace.organizationId}
          organizationSlug={activeWorkspace.organizationSlug}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
      <CreateOrganizationDialog
        open={createOrgDialogOpen}
        onOpenChange={setCreateOrgDialogOpen}
      />
    </SidebarMenu>
  );
}
