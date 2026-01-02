"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaces } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

export interface GettingStartedStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

export function useGettingStarted() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspaces();

  // Получаем настройки компании
  const { data: companySettings, isLoading } = useQuery({
    ...trpc.company.get.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Мутация для обновления статуса онбординга
  const updateOnboardingMutation = useMutation({
    mutationFn: async (data: {
      workspaceId: string;
      dismissedGettingStarted?: boolean;
      onboardingCompleted?: boolean;
    }) => {
      // TODO: Реализовать после исправления типов
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.company.get.queryKey({
          workspaceId: workspace?.id ?? "",
        }),
      });
    },
  });

  // Проверяем localStorage для скрытия виджета
  const getLocalStorageKey = () => `gettingStartedDismissed_${workspace?.id}`;

  const isLocallyDismissed = () => {
    if (typeof window === "undefined" || !workspace?.id) return false;
    return localStorage.getItem(getLocalStorageKey()) === "true";
  };

  // Определяем шаги онбординга
  const steps: GettingStartedStep[] = [
    {
      id: "company-setup",
      title: "Настроить компанию",
      description: "Добавьте название, описание и настройки бота",
      completed: !!(
        companySettings?.name && companySettings.name !== "Моя компания"
      ),
    },
    {
      id: "create-vacancy",
      title: "Создать первую вакансию",
      description: "Добавьте вакансию для поиска кандидатов",
      completed: false, // TODO: проверить наличие вакансий
    },
    {
      id: "hh-integration",
      title: "Подключить HH.ru",
      description: "Интегрируйтесь с HeadHunter для автоматического поиска",
      completed: false, // TODO: проверить интеграцию
    },
    {
      id: "telegram-setup",
      title: "Настроить Telegram",
      description: "Подключите бота для уведомлений и интервью",
      completed: false, // TODO: проверить Telegram интеграцию
    },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Определяем, показывать ли виджет
  const shouldShowWidget =
    !isLoading &&
    workspace?.id &&
    // !companySettings?.dismissedGettingStarted && // TODO: добавить после обновления схемы
    !isLocallyDismissed() &&
    progressPercentage < 100;

  // Функции для управления виджетом
  const dismissWidget = (forever = false) => {
    if (!workspace?.id) return;

    if (forever) {
      // Сохраняем в БД
      updateOnboardingMutation.mutate({
        workspaceId: workspace.id,
        dismissedGettingStarted: true,
      });
    } else {
      // Сохраняем только в localStorage
      localStorage.setItem(getLocalStorageKey(), "true");
    }
  };

  const markOnboardingCompleted = () => {
    if (!workspace?.id) return;

    updateOnboardingMutation.mutate({
      workspaceId: workspace.id,
      onboardingCompleted: true,
      dismissedGettingStarted: true,
    });
  };

  return {
    steps,
    completedSteps,
    totalSteps,
    progressPercentage,
    shouldShowWidget,
    isLoading,
    dismissWidget,
    markOnboardingCompleted,
    isUpdating: updateOnboardingMutation.isPending,
  };
}
