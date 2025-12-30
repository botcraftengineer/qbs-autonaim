"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Редактирование вакансии
        </h1>
        <p className="text-muted-foreground mt-1">
          Измените название и описание вакансии
        </p>
      </div>

      <VacancyEditForm
        initialData={{
          title: vacancy.title,
          description: vacancy.description,
        }}
        onSave={handleSave}
      />
    </div>
  );
}
