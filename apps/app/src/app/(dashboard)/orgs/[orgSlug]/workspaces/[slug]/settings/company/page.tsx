"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { CompanyForm } from "~/components/settings/company-form";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

export default function SettingsCompanyPage() {
  const trpc = useTRPC();
  const { workspace, isLoading: workspaceLoading } = useWorkspace();

  const workspaceId = workspace?.id;
  const userRole = workspace?.role;

  const { data: company, isLoading } = useQuery({
    ...trpc.company.get.queryOptions({
      workspaceId: workspaceId || "",
    }),
    enabled: !!workspaceId,
  });

  if (isLoading || workspaceLoading || !workspaceId) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <CompanyForm
        workspaceId={workspaceId}
        initialData={{
          name: company?.companyName || "",
          website: company?.companyWebsite || "",
          description: company?.companyDescription || "",
        }}
        userRole={userRole}
      />
    </div>
  );
}
