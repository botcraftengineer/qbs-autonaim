import type { ReactNode } from "react";
import { SiteHeader } from "~/components/layout";
import { SettingsSidebar } from "~/components/settings/settings-sidebar";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  await params;

  return (
    <>
      <SiteHeader title="" />
      <div className="space-y-4 p-4 pb-8 sm:space-y-6 sm:p-6 lg:p-10 lg:pb-16 max-w-5xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground">
            Управляйте настройками workspace и интеграциями.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
          <aside className="lg:w-[240px] shrink-0">
            <div className="rounded-lg border p-2">
              <SettingsSidebar />
            </div>
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}
