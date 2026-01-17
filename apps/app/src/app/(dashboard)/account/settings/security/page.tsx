"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "~/components/layout";
import { SecurityTab } from "~/components/settings/security-tab";
import { useTRPC } from "~/trpc/react";

export default function SecuritySettingsPage() {
  const trpc = useTRPC();
  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <Skeleton className="h-[400px] w-full" />
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <SiteHeader />
      <SecurityTab user={user} />
    </>
  );
}
