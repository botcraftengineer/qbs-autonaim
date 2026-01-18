"use client";

import { Button } from "@qbs-autonaim/ui";
import { IconRefresh, IconSparkles } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { triggerUpdateVacancies } from "~/actions/trigger";
import { PageHeader } from "~/components/layout";
import {
  VacancyFilters,
  VacancyStats,
  VacancyTable,
} from "~/components/vacancies";
import { useVacancyFilters } from "~/hooks/use-vacancy-filters";
import { useVacancyStats } from "~/hooks/use-vacancy-stats";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export default function VacanciesPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const api = useTRPC();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [mergeOpenVacancyId, setMergeOpenVacancyId] = useState<string | null>(
    null,
  );
  const [mergeTargetVacancyId, setMergeTargetVacancyId] = useState<string>("");

  const { data: vacancies, isLoading } = useQuery({
    ...api.freelancePlatforms.getVacancies.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  const {
    searchQuery,
    setSearchQuery,
    sourceFilter,
    setSourceFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredAndSortedVacancies,
    hasFilters,
  } = useVacancyFilters(vacancies);

  const stats = useVacancyStats(vacancies);

  const mergeVacanciesMutation = useMutation(
    api.freelancePlatforms.mergeVacancies.mutationOptions({
      onSuccess: async () => {
        toast.success("Вакансии сдружены");
        setMergeOpenVacancyId(null);
        setMergeTargetVacancyId("");
        await queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancies.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось сдружить вакансии");
      },
    }),
  );

  const handleUpdate = async () => {
    if (!workspace?.id) {
      toast.error("Workspace не найден");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await triggerUpdateVacancies(workspace.id);
      if (result.success) {
        toast.success("Обновление вакансий запущено");
      } else {
        toast.error("Ошибка при запуске обновления");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMergeConfirm = (sourceId: string, targetId: string) => {
    if (!workspace?.id) return;
    mergeVacanciesMutation.mutate({
      workspaceId: workspace.id,
      sourceVacancyId: sourceId,
      targetVacancyId: targetId,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Вакансии"
        description="Управление вакансиями и их настройками"
        tooltipContent="Здесь вы можете создавать вакансии для фриланс-платформ, синхронизировать их статусы, просматривать отклики и объединять дубликаты. [Подробнее в документации](https://docs.hh.qbs.ru/vacancies)"
      >
        <div className="flex gap-2">
          <Button asChild variant="default">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/create`}
              aria-label="Создать вакансию для фриланс-платформы"
            >
              <IconSparkles className="size-4" aria-hidden="true" />
              Создать вакансию
            </Link>
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            variant="outline"
            aria-label="Синхронизировать активные вакансии из источников"
          >
            <IconRefresh
              className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {isUpdating ? "Синхронизация…" : "Синхронизировать"}
          </Button>
        </div>
      </PageHeader>

      <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 py-4">
        <VacancyStats
          totalVacancies={stats.totalVacancies}
          activeVacancies={stats.activeVacancies}
          totalResponses={stats.totalResponses}
          newResponses={stats.newResponses}
          isLoading={isLoading}
        />

        <div className="space-y-4">
          <VacancyFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sourceFilter={sourceFilter}
            onSourceChange={setSourceFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
          />

          {!isLoading && filteredAndSortedVacancies.length > 0 && (
            <div className="mb-3 text-sm text-muted-foreground">
              Найдено вакансий:{" "}
              <span className="font-medium tabular-nums">
                {filteredAndSortedVacancies.length}
              </span>
              {hasFilters &&
                vacancies &&
                filteredAndSortedVacancies.length !== vacancies.length && (
                  <span> из&nbsp;{vacancies.length}</span>
                )}
            </div>
          )}

          <VacancyTable
            vacancies={filteredAndSortedVacancies}
            isLoading={isLoading}
            orgSlug={orgSlug ?? ""}
            workspaceSlug={workspaceSlug ?? ""}
            workspaceId={workspace?.id}
            allVacancies={vacancies ?? []}
            mergeOpenVacancyId={mergeOpenVacancyId}
            mergeTargetVacancyId={mergeTargetVacancyId}
            onMergeOpen={setMergeOpenVacancyId}
            onMergeClose={() => {
              setMergeOpenVacancyId(null);
              setMergeTargetVacancyId("");
            }}
            onMergeTargetChange={setMergeTargetVacancyId}
            onMergeConfirm={handleMergeConfirm}
            isMerging={mergeVacanciesMutation.isPending}
            hasFilters={hasFilters}
          />
        </div>
      </div>
    </div>
  );
}
