"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { CompanyForm } from "~/components/settings/company-form";
import { useTRPC } from "~/trpc/react";

export default function SettingsCompanyPage() {
  const trpc = useTRPC();
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const orgSlug = params.orgSlug as string;

  const { data: orgData } = useQuery(
    trpc.organization.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const { data: workspaceData } = useQuery({
    ...trpc.workspace.getBySlug.queryOptions({
      slug: workspaceSlug,
      organizationId: orgData?.id ?? "",
    }),
    enabled: !!orgData?.id,
  });

  const workspaceId = workspaceData?.workspace.id;
  const userRole = workspaceData?.role;

  // Получаем настройки компании
  const { data: company, isLoading } = useQuery({
    ...trpc.company.get.queryOptions({
      workspaceId: workspaceId || "",
    }),
    enabled: !!workspaceId,
  });

  if (isLoading || !workspaceId) {
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
          name: company?.name || "",
          website: company?.website || "",
          description: company?.description || "",
        }}
        userRole={userRole}
      />
    </div>
  );
}
