"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export function useSidebarStats(workspaceId: string | undefined) {
  const trpc = useTRPC();

  const { data: dashboardStats } = useQuery({
    ...trpc.vacancy.dashboardStats.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
    staleTime: 30_000, // 30 секунд — не перезапрашиваем слишком часто
    refetchInterval: 60_000, // Обновляем каждую минуту
  });

  return {
    newResponses: dashboardStats?.newResponses ?? 0,
    totalResponses: dashboardStats?.totalResponses ?? 0,
    activeVacancies: dashboardStats?.activeVacancies ?? 0,
    highScoreResponses: dashboardStats?.highScoreResponses ?? 0,
  };
}
