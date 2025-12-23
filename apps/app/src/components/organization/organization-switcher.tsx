"use client";

import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@qbs-autonaim/ui";
import {
  IconBuildingSkyscraper,
  IconPlus,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

type OrganizationWithRole = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: "owner" | "admin" | "member";
  memberCount?: number;
  workspaceCount?: number;
};

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
  onOrganizationChangeAction,
}: {
  organizations: OrganizationWithRole[];
  activeOrganizationId?: string;
  onOrganizationChangeAction?: (organizationId: string) => void;
}) {
  const { isMobile } = useSidebar();
  const [activeOrganization, setActiveOrganization] = React.useState(
    organizations.find((o) => o.id === activeOrganizationId) ??
      organizations[0],
  );

  if (!activeOrganization) {
    return null;
  }

  const handleOrganizationChange = (organization: OrganizationWithRole) => {
    setActiveOrganization(organization);
    onOrganizationChangeAction?.(organization.id);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      owner: "Владелец",
      admin: "Администратор",
      member: "Участник",
    };
    return labels[role as keyof typeof labels] ?? role;
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
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeOrganization.logo ? (
                  // biome-ignore lint/performance/noImgElement: external URL from database
                  <img
                    src={activeOrganization.logo}
                    alt={activeOrganization.name}
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <IconBuildingSkyscraper className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">
                    {activeOrganization.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Текущая
                  </Badge>
                </div>
                <span className="truncate text-xs">
                  {getRoleLabel(activeOrganization.role)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
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
                  {activeOrganization.logo ? (
                    // biome-ignore lint/performance/noImgElement: external URL from database
                    <img
                      src={activeOrganization.logo}
                      alt={activeOrganization.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <IconBuildingSkyscraper className="size-5" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-sm">
                    {activeOrganization.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {activeOrganization.workspaceCount ?? 0}{" "}
                    {activeOrganization.workspaceCount === 1
                      ? "Воркспейс"
                      : "Воркспейсов"}{" "}
                    · {activeOrganization.memberCount ?? 1}{" "}
                    {activeOrganization.memberCount === 1
                      ? "Участник"
                      : "Участников"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  asChild
                >
                  <a href={`/orgs/${activeOrganization.slug}/settings`}>
                    <IconSettings className="size-4" />
                    <span className="text-sm">Настройки</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex-1 cursor-pointer justify-center gap-2 p-2"
                  asChild
                >
                  <a href={`/orgs/${activeOrganization.slug}/settings/members`}>
                    <IconUserPlus className="size-4" />
                    <span className="text-sm">Пригласить</span>
                  </a>
                </DropdownMenuItem>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Организации
            </DropdownMenuLabel>
            {organizations.map((organization, index) => (
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
                    <IconBuildingSkyscraper className="size-3.5 shrink-0" />
                  )}
                </div>
                <span className="flex-1">{organization.name}</span>
                {organization.id === activeOrganization.id && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    Активная
                  </Badge>
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                // TODO: Открыть диалог создания организации
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <IconPlus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Создать организацию
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
