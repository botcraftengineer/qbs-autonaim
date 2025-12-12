"use client";

import { Button, Skeleton } from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import { VacancySettingsForm } from "~/components/vacancy/vacancy-settings-form";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancySettingsPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default function VacancySettingsPage({
  params,
}: VacancySettingsPageProps) {
  const { workspaceSlug, id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();

  const { data: vacancy, isLoading } = useQuery({
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
  }) => {
    if (!workspaceId) return;

    await updateSettingsMutation.mutateAsync({
      vacancyId: id,
      workspaceId,
      settings: data,
    });
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Загрузка…" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Skeleton className="mb-4 h-10 w-40" />
                <div className="space-y-6">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-96" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!vacancy) {
    return (
      <>
        <SiteHeader title="Не найдено" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">Вакансия не найдена</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title={`Настройки: ${vacancy.title}`} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6">
                <Link href={`/${workspaceSlug}/vacancies/${id}/detail`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                    Назад к вакансии
                  </Button>
                </Link>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  Настройки AI-бота
                </h1>
                <p className="text-muted-foreground mt-1">
                  Настройте поведение бота для вакансии «{vacancy.title}»
                </p>
              </div>

              <VacancySettingsForm
                vacancyId={id}
                initialData={{
                  customBotInstructions: vacancy.customBotInstructions,
                  customScreeningPrompt: vacancy.customScreeningPrompt,
                  customInterviewQuestions: vacancy.customInterviewQuestions,
                }}
                onSave={handleSave}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
