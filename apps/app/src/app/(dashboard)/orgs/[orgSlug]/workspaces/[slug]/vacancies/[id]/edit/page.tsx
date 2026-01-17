"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import { VacancyEditForm } from "~/components/vacancy";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancyEditPageProps {
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default function VacancyEditPage({ params }: VacancyEditPageProps) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();

  const { data: vacancy } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const updateDetailsMutation = useMutation(
    trpc.vacancy.updateDetails.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.get.queryKey({
            id,
            workspaceId: workspaceId ?? "",
          }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.list.queryKey(),
        });
      },
    }),
  );

  const handleSave = async (data: {
    title: string;
    description?: string | null;
  }) => {
    if (!workspaceId) return;

    await updateDetailsMutation.mutateAsync({
      vacancyId: id,
      workspaceId,
      data,
    });
  };

  if (!vacancy) {
    return null;
  }

  return (
    <>
      <SiteHeader />
      <div className="space-y-6">
        <VacancyEditForm
          initialData={{
            title: vacancy.title,
            description: vacancy.description,
          }}
          onSave={handleSave}
        />
      </div>
    </>
  );
}
