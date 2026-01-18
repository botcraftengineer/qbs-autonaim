"use client";

import { use } from "react";
import {
  ActiveVacancies,
  DashboardStats,
  RecentResponses,
  ResponsesChart,
  TopResponses,
} from "~/components/dashboard";
import { SiteHeader } from "~/components/layout";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug: workspaceSlug } = use(params);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DashboardStats />
          <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
            <RecentResponses orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
            <ActiveVacancies orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
          </div>
          <div className="px-4 lg:px-6">
            <TopResponses orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
          </div>
          <div className="px-4 lg:px-6">
            <ResponsesChart />
          </div>
        </div>
      </div>
    </div>
  );
}
