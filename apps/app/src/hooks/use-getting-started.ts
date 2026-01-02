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
  const { data: companySettings, isLoading: isLoadingCompany } = useQuery({
    ...trpc.company.get.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Получаем список вакансий
  const { data: vacancies, isLoading: isLoadingVacancies } = useQuery({
    ...trpc.vacancy.list.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Получаем список интеграций
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    ...trpc.integration.list.queryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: !!workspace?.id,
  });

  // Получаем Telegram сессии
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    ...trpc.telegram.getSessions.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Мутация для обновления статуса онбординга
  const updateOnboardingMutation = useMutation(
    trpc.company.updateOnboarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.company.get.queryKey({
            workspaceId: workspace?.id ?? "",
          }),
        });
      },
      onError: (error) => {
        console.error("Failed to update onboarding status:", error);
      },
    }),
  );

  // Проверяем localStorage для скрытия виджета
  const getLocalStorageKey = () => `gettingStartedDismissed_${workspace?.id}`;

  const isLocallyDismissed = () => {
    if (typeof window === "undefined" || !workspace?.id) return false;
    return localStorage.getItem(getLocalStorageKey()) === "true";
  };

  const isLoading =
    isLoadingCompany ||
    isLoadingVacancies ||
    isLoadingIntegrations ||
    isLoadingSessions;

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
      completed: !!(vacancies && vacancies.length > 0),
    },
    {
      id: "hh-integration",
      title: "Подключить HH.ru",
      description: "Интегрируйтесь с HeadHunter для автоматического поиска",
      completed: !!integrations?.some((i) => i.type === "hh"),
    },
    {
      id: "telegram-setup",
      title: "Настроить Telegram",
      description: "Подключите бота для уведомлений и интервью",
      completed: !!(
        sessions &&
        sessions.length > 0 &&
        !sessions.some((s) => s.authError)
      ),
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
