"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@selectio/ui";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import type * as React from "react";
import {
  NavDocuments,
  NavMain,
  NavSecondary,
  NavUser,
} from "~/components/sidebar";

const data = {
  navMain: [
    {
      title: "Панель управления",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Жизненный цикл",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Аналитика",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Проекты",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Команда",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Захват",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Активные предложения",
          url: "#",
        },
        {
          title: "Архив",
          url: "#",
        },
      ],
    },
    {
      title: "Предложение",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Активные предложения",
          url: "#",
        },
        {
          title: "Архив",
          url: "#",
        },
      ],
    },
    {
      title: "Подсказки",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Активные предложения",
          url: "#",
        },
        {
          title: "Архив",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Настройки",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Помощь",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Поиск",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Библиотека данных",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Отчеты",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Помощник Word",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Selectio Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
