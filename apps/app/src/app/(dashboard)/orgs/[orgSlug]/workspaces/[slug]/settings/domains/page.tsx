"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { CustomDomainsSection } from "~/components/workspace";
import { useWorkspace } from "~/hooks/use-workspace";

export default function WorkspaceDomainsPage() {
  const {
    workspace,
    isLoading,
    organizationIsLoading,
    error,
    organizationError,
  } = useWorkspace();

  // Показываем индикатор загрузки, если загружается workspace или организация
  if (isLoading || organizationIsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-1 h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Обрабатываем ошибки загрузки
  if (error || organizationError) {
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      return "Произошла неизвестная ошибка";
    };

    const errorMessage = error
      ? getErrorMessage(error)
      : getErrorMessage(organizationError);

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-900">Ошибка загрузки</p>
        <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
      </div>
    );
  }

  // Проверяем наличие workspace после всех проверок загрузки и ошибок
  if (!workspace) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">Workspace не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomDomainsSection workspaceId={workspace.id} />
    </div>
  );
}
