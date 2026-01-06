"use client";

import { Button, Input, Separator, SidebarTrigger } from "@qbs-autonaim/ui";
import { Command, Search } from "lucide-react";

interface SiteHeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function SiteHeader({
  title = "Панель управления",
  children,
}: SiteHeaderProps) {
  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6 lg:py-4">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="lg:flex-1">
          <div className="relative hidden max-w-sm flex-1 lg:block">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Поиск..."
              className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
            />
            <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
              <Command className="size-3" aria-hidden="true" />
              <span>k</span>
            </div>
          </div>
          <div className="block lg:hidden">
            <Button variant="ghost" size="icon" className="size-9">
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {children && (
          <div className="ml-auto flex items-center gap-2">{children}</div>
        )}
      </div>
    </header>
  );
}
