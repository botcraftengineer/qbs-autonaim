"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { IntegrationCard } from "~/components/settings/integration-card";
import { IntegrationDialog } from "~/components/settings/integration-dialog";
import { TelegramSessionsCard } from "~/components/settings/telegram-sessions-card";
import { AVAILABLE_INTEGRATIONS } from "~/lib/integrations";
import { useTRPC } from "~/trpc/react";

export default function IntegrationsPage() {
  const api = useTRPC();
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const orgSlug = params.orgSlug as string;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: orgData } = useQuery(
    api.organization.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const { data: workspaceData } = useQuery({
    ...api.workspace.getBySlug.queryOptions({
      slug: workspaceSlug,
      organizationId: orgData?.id ?? "",
    }),
    enabled: !!orgData?.id,
  });

  const workspaceId = workspaceData?.workspace?.id || "";
  const userRole = workspaceData?.role;

  const integrationsQueryOptions = api.integration.list.queryOptions({
    workspaceId,
  });
  const { data: integrations, isLoading } = useQuery({
    ...integrationsQueryOptions,
    enabled: !!workspaceId,
  });

  const handleCreate = (type: string) => {
    setSelectedType(type);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (type: string) => {
    setSelectedType(type);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {workspaceId && <TelegramSessionsCard workspaceId={workspaceId} />}

      <div className="grid gap-4">
        {AVAILABLE_INTEGRATIONS.map((availableIntegration) => {
          const existingIntegration = integrations?.find(
            (i) => i.type === availableIntegration.type,
          );

          return (
            <IntegrationCard
              key={availableIntegration.type}
              availableIntegration={availableIntegration}
              integration={existingIntegration}
              onCreate={() => handleCreate(availableIntegration.type)}
              onEdit={() => handleEdit(availableIntegration.type)}
              workspaceId={workspaceId}
              userRole={userRole}
            />
          );
        })}
      </div>

      <IntegrationDialog
        open={dialogOpen}
        onClose={handleClose}
        selectedType={selectedType}
        isEditing={isEditing}
      />
    </div>
  );
}
