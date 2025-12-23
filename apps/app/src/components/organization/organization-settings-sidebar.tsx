"use client";

import { cn } from "@qbs-autonaim/ui";
import { Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarNavItems = [
  {
    title: "Общие",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Участники",
    href: "/settings/members",
    icon: Users,
  },
];

export function OrganizationSettingsSidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {sidebarNavItems.map((item) => {
        const href = `/orgs/${orgSlug}${item.href}`;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              pathname === href
                ? "bg-accent text-foreground"
                : "text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
