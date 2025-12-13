"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { VacancySettingsForm } from "~/components/vacancy/vacancy-settings-form";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancySettingsPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default function VacancySettingsPage({
  params,
}: VacancySettingsPageProps) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();

  const { data: vacancy } = useQuery({
    ...trpc.vacancy.getById.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const updateSettingsMutation = useMutation(
    trpc.vacancy.updateSettings.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: [
            ["vacancy", "getById"],
            { input: { id, workspaceId: workspaceId ?? "" } },
          ],
        });
      },
    }),
  );

  const handleSave = async (data: {
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
  }) => {
    if (!workspaceId) return;

    await updateSettingsMutation.mutateAsync({
      vacancyId: id,
      workspaceId,
      settings: data,
    });
  };

  if (!vacancy) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки AI-бота</h1>
        <p className="text-muted-foreground mt-1">
          Настройте поведение бота для вакансии «{vacancy.title}»
        </p>
      </div>

      <VacancySettingsForm
        initialData={{
          customBotInstructions: vacancy.customBotInstructions,
          customScreeningPrompt: vacancy.customScreeningPrompt,
          customInterviewQuestions: vacancy.customInterviewQuestions,
          customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
        }}
        onSave={handleSave}
      />
    </div>
  );
}
