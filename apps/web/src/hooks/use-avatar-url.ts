"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

/**
 * Хук для получения URL аватара с контролем доступа
 *
 * @param fileId - ID файла аватара из БД
 * @returns URL аватара или null
 */
export function useAvatarUrl(fileId: string | null | undefined) {
  const { workspaceId } = useWorkspaceContext();
  const trpc = useTRPC();

  const { data } = useQuery({
    ...trpc.files.getImageUrl.queryOptions({
      workspaceId: workspaceId ?? "",
      fileId: fileId ?? "",
    }),
    enabled: !!workspaceId && !!fileId,
    // Кэшируем на 4 минуты (URL живет 5 минут)
    staleTime: 4 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return data?.url ?? null;
}
