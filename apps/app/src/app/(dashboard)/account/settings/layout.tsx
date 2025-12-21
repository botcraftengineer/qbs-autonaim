"use client";

import { Tabs, TabsList, TabsTrigger } from "@qbs-autonaim/ui";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = pathname === "/account/settings/security" ? "security" : "general";

  const handleTabChange = (value: string) => {
    if (value === "general") {
      router.push("/account/settings");
    } else {
      router.push(`/account/settings/${value}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Настройки аккаунта
        </h1>
        <p className="text-muted-foreground mt-2">
          Управляйте настройками вашего аккаунта
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <div className="mt-6">{children}</div>
      </Tabs>
    </div>
  );
}
