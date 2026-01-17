"use client";

import { env as baseEnv } from "@qbs-autonaim/config";
import { Skeleton } from "@qbs-autonaim/ui";
import { WorkspaceForm } from "~/components/settings/workspace-form";
import { useWorkspace } from "~/hooks/use-workspace";

export default function SettingsPage() {
  const { workspace, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-32" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">Workspace не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <WorkspaceForm
          initialData={{
            name: workspace.name,
            slug: workspace.slug,
            logo: workspace.logo,
          }}
          workspaceId={workspace.id}
          userRole={workspace.role}
          appUrl={baseEnv.NEXT_PUBLIC_APP_URL}
        />
      </div>
    </div>
  );
}
