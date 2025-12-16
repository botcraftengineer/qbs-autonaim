"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import {
  ConversionCards,
  type FunnelStageData,
  FunnelStagesCard,
  StatusStatsCards,
  VacancyStatsCard,
} from "./analytics";

export function FunnelAnalytics() {
  const params = useParams<{ workspaceSlug: string }>();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("all");
  const trpc = useTRPC();

  const { data: workspaceData, isLoading: isLoadingWorkspace } = useQuery(
    trpc.workspace.getBySlug.queryOptions({ slug: params.workspaceSlug }),
  );

  const workspaceId = workspaceData?.workspace.id;

  const { data: vacanciesList } = useQuery({
    ...trpc.vacancy.list.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: analyticsError,
    error: analyticsErrorData,
  } = useQuery({
    ...trpc.funnel.analytics.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancyId === "all" ? undefined : selectedVacancyId,
    }),
    enabled: !!workspaceId,
  });

  const {
    data: vacancyStats,
    isError: vacancyStatsError,
    error: vacancyStatsErrorData,
  } = useQuery({
    ...trpc.funnel.vacancyStats.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancyId === "all" ? undefined : selectedVacancyId,
    }),
    enabled: !!workspaceId,
  });

  const isLoading = isLoadingWorkspace || isLoadingAnalytics;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (analyticsError && vacancyStatsError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-red-200">
        <div className="text-center px-4">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Ошибка загрузки данных
          </h2>
          <p className="text-sm text-muted-foreground">
            {analyticsErrorData?.message || "Не удалось загрузить аналитику"}
          </p>
        </div>
      </div>
    );
  }

  const total = analytics?.totalCandidates ?? 0;
  const funnelStages: FunnelStageData[] = [
    {
      name: "Новые кандидаты",
      count: analytics?.byStage.NEW ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.NEW ?? 0) / total) * 100)
          : 0,
      color: "bg-blue-500",
    },
    {
      name: "На рассмотрении",
      count: analytics?.byStage.REVIEW ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.REVIEW ?? 0) / total) * 100)
          : 0,
      color: "bg-amber-500",
    },
    {
      name: "Собеседование",
      count: analytics?.byStage.INTERVIEW ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.INTERVIEW ?? 0) / total) * 100)
          : 0,
      color: "bg-purple-500",
    },
    {
      name: "Наняты",
      count: analytics?.byStage.HIRED ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.HIRED ?? 0) / total) * 100)
          : 0,
      color: "bg-emerald-500",
    },
  ];

  const overallConversion =
    total > 0
      ? (((analytics?.byStage.HIRED ?? 0) / total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Аналитика найма
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Детальная статистика процесса найма
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select
            value={selectedVacancyId}
            onValueChange={setSelectedVacancyId}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <Filter className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder="Все вакансии" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все вакансии</SelectItem>
              {vacanciesList?.map((vacancy) => (
                <SelectItem key={vacancy.id} value={vacancy.id}>
                  {vacancy.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Последние 7 дней</SelectItem>
              <SelectItem value="30d">Последние 30 дней</SelectItem>
              <SelectItem value="90d">Последние 3 месяца</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analyticsError && !vacancyStatsError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4"
        >
          <p className="text-sm text-red-600">
            Не удалось загрузить аналитику
            {analyticsErrorData?.message && `: ${analyticsErrorData.message}`}
          </p>
        </div>
      )}

      <StatusStatsCards analytics={analytics} />

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid h-10">
          <TabsTrigger value="funnel" className="text-xs sm:text-sm">
            Воронка
          </TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs sm:text-sm">
            Конверсия
          </TabsTrigger>
          <TabsTrigger value="vacancies" className="text-xs sm:text-sm">
            Вакансии
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <FunnelStagesCard
            stages={funnelStages}
            overallConversion={overallConversion}
          />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <ConversionCards
            stages={funnelStages}
            analytics={analytics}
            overallConversion={overallConversion}
          />
        </TabsContent>

        <TabsContent value="vacancies" className="space-y-4">
          <VacancyStatsCard
            vacancyStats={vacancyStats}
            isError={vacancyStatsError}
            errorMessage={vacancyStatsErrorData?.message}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
