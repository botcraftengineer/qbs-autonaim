"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { CustomDomainsSection } from "~/components/workspace";
import { useWorkspace } from "~/hooks/use-workspace";

export default function WorkspaceDomainsPage() {
  const { workspace, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-1 h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">Workspace не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomDomainsSection workspaceId={workspace.id} />
    </div>
  );
}
