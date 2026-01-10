"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  toast,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import { GigInterviewSettings } from "~/components/gig/gig-interview-settings";
import { GigInvitationTemplate } from "~/components/gig/gig-invitation-template";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface GigDetailClientProps {
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

function GigDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatBudget(
  min?: number | null,
  max?: number | null,
  currency = "RUB",
) {
  if (!min && !max) return "Не указан";

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  if (min && max) {
    return `${formatAmount(min)}–${formatAmount(max)}\u00A0${currency}`;
  }

  if (min) {
    return `от\u00A0${formatAmount(min)}\u00A0${currency}`;
  }

  if (max) {
    return `до\u00A0${formatAmount(max)}\u00A0${currency}`;
  }

  return "Не указан";
}

function formatDate(date: Date | null) {
  if (!date) return "Не указан";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getGigTypeLabel(type: string) {
  const types: Record<string, string> = {
    DEVELOPMENT: "Разработка",
    DESIGN: "Дизайн",
    COPYWRITING: "Копирайтинг",
    MARKETING: "Маркетинг",
    TRANSLATION: "Перевод",
    VIDEO: "Видео",
    AUDIO: "Аудио",
    DATA_ENTRY: "Ввод данных",
    RESEARCH: "Исследования",
    CONSULTING: "Консультации",
    OTHER: "Другое",
  };

  return types[type] || type;
}

const GigStats = memo(function GigStats({
  views,
  responseCounts,
  isCountsPending,
  isCountsError,
}: {
  views: number;
  responseCounts?: { total: number; new: number } | null;
  isCountsPending: boolean;
  isCountsError: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Статистика</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Просмотры
          </div>
          <span className="font-medium tabular-nums">{views || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Отклики
          </div>
          {isCountsPending ? (
            <Skeleton className="h-5 w-8" />
          ) : isCountsError ? (
            <span className="font-medium text-muted-foreground">—</span>
          ) : (
            <span className="font-medium tabular-nums">
              {responseCounts?.total || 0}
            </span>
          )}
        </div>

        {!isCountsPending &&
          !isCountsError &&
          (responseCounts?.new || 0) > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" aria-hidden="true" />
                Новые отклики
              </div>
              <Badge variant="default">{responseCounts?.new}</Badge>
            </div>
          )}
      </CardContent>
    </Card>
  );
});

const ProjectDetails = memo(function ProjectDetails({
  budgetMin,
  budgetMax,
  budgetCurrency,
  estimatedDuration,
  deadline,
}: {
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string | null;
  estimatedDuration?: string | null;
  deadline?: Date | null;
}) {
  return (
    <Card>
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-lg sm:text-xl">Детали проекта</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0" aria-hidden="true" />
            Бюджет
          </div>
          <p className="font-medium text-sm sm:text-base hyphens-auto">
            {formatBudget(budgetMin, budgetMax, budgetCurrency || "RUB")}
          </p>
        </div>

        {estimatedDuration && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              Длительность
            </div>
            <p className="font-medium text-sm sm:text-base hyphens-auto">
              {estimatedDuration}
            </p>
          </div>
        )}

        {deadline && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
              Дедлайн
            </div>
            <p className="font-medium text-sm sm:text-base">
              {formatDate(deadline)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export function GigDetailClient({
  orgSlug,
  workspaceSlug,
  gigId,
}: GigDetailClientProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    workspace,
    organization,
    isLoading: workspaceLoading,
    organizationIsLoading,
  } = useWorkspace();
  const workspaceId = workspace?.id;

  const {
    data: gig,
    isPending,
    error,
    isError,
  } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  const {
    data: responseCounts,
    isPending: isCountsPending,
    isError: isCountsError,
    error: countsError,
  } = useQuery({
    ...trpc.gig.responses.count.queryOptions({
      gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  if (isCountsError && countsError) {
    console.error("Ошибка загрузки счетчиков откликов:", countsError);
  }

  // Redirect to not-found if gig doesn't exist
  useEffect(() => {
    if (
      !workspaceLoading &&
      !organizationIsLoading &&
      !isPending &&
      (isError || !gig || !workspace || !organization)
    ) {
      router.push("/404");
    }
  }, [
    workspaceLoading,
    organizationIsLoading,
    isPending,
    isError,
    gig,
    workspace,
    organization,
    router,
  ]);

  const deleteMutation = useMutation(
    trpc.gig.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Задание удалено");
        queryClient.invalidateQueries({
          queryKey: trpc.gig.list.queryKey(),
        });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось удалить задание");
      },
    }),
  );

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Ссылка скопирована в буфер обмена");
      })
      .catch(() => {
        toast.error("Не удалось скопировать ссылку");
      });
  }, [orgSlug, workspaceSlug, gigId]);

  const handleSettings = useCallback(() => {
    toast.info("Функция «Настройки» скоро будет доступна");
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!workspaceId) return;
    deleteMutation.mutate({ gigId, workspaceId });
  }, [workspaceId, gigId, deleteMutation]);

  if (workspaceLoading || organizationIsLoading || isPending) {
    return <GigDetailSkeleton />;
  }

  if (error || !gig || !workspace || !organization) {
    return null; // useEffect will handle redirect
  }

  return (
    <div className="container mx-auto max-w-6xl py-4 px-4 sm:py-6 sm:px-6">
      <nav className="mb-4 sm:mb-6" aria-label="Навигация">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:text-foreground transition-colors touch-action-manipulation min-h-[44px] sm:min-h-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад к заданиям
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {getGigTypeLabel(gig.type)}
                    </Badge>
                    {!gig.isActive && (
                      <Badge variant="outline">Неактивно</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl sm:text-2xl hyphens-auto">
                    {gig.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Создано {formatDate(gig.createdAt)}
                    {gig.updatedAt && gig.updatedAt !== gig.createdAt && (
                      <span className="hidden sm:inline">
                        {"\u00A0•\u00A0"}Обновлено {formatDate(gig.updatedAt)}
                      </span>
                    )}
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Открыть меню действий"
                      className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] touch-action-manipulation"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
                      >
                        <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                        Редактировать
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Поделиться
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleSettings}>
                      <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                      Настройки
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={handleDeleteClick}
                    >
                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {gig.description && (
              <CardContent className="p-4 sm:p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap hyphens-auto text-sm sm:text-base">
                    {gig.description}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {gig.requirements && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Требования</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {gig.requirements.summary && (
                  <section>
                    <h3 className="font-medium mb-2 text-sm sm:text-base">
                      Описание
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap hyphens-auto">
                      {gig.requirements.summary}
                    </p>
                  </section>
                )}

                {gig.requirements.deliverables &&
                  gig.requirements.deliverables.length > 0 && (
                    <section>
                      <h3 className="font-medium mb-2 text-sm sm:text-base">
                        Что нужно сделать
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {gig.requirements.deliverables.map((item: string) => (
                          <li key={item} className="flex items-start gap-2">
                            <span
                              className="text-primary mt-1 shrink-0"
                              aria-hidden="true"
                            >
                              •
                            </span>
                            <span className="hyphens-auto">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                {gig.requirements.required_skills &&
                  gig.requirements.required_skills.length > 0 && (
                    <section>
                      <h3 className="font-medium mb-2 text-sm sm:text-base">
                        Обязательные навыки
                      </h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {gig.requirements.required_skills.map(
                          (skill: string) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs sm:text-sm"
                            >
                              {skill}
                            </Badge>
                          ),
                        )}
                      </div>
                    </section>
                  )}

                {gig.requirements.nice_to_have_skills &&
                  gig.requirements.nice_to_have_skills.length > 0 && (
                    <section>
                      <h3 className="font-medium mb-2 text-sm sm:text-base">
                        Желательные навыки
                      </h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {gig.requirements.nice_to_have_skills.map(
                          (skill: string) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs sm:text-sm"
                            >
                              {skill}
                            </Badge>
                          ),
                        )}
                      </div>
                    </section>
                  )}

                {gig.requirements.tech_stack &&
                  gig.requirements.tech_stack.length > 0 && (
                    <section>
                      <h3 className="font-medium mb-2 text-sm sm:text-base">
                        Технологии
                      </h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {gig.requirements.tech_stack.map((tech: string) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs sm:text-sm"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}
              </CardContent>
            </Card>
          )}

          {gig.url && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Внешняя ссылка
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Button
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto min-h-[44px] touch-action-manipulation"
                >
                  <a href={gig.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                    Открыть на {gig.source}
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          <GigInterviewSettings gigId={gigId} />
          <GigInvitationTemplate gigId={gigId} gigTitle={gig.title} />
        </div>

        <aside
          className="space-y-4 sm:space-y-6"
          aria-label="Дополнительная информация"
        >
          <GigStats
            views={gig.views || 0}
            responseCounts={responseCounts}
            isCountsPending={isCountsPending}
            isCountsError={isCountsError}
          />

          <ProjectDetails
            budgetMin={gig.budgetMin}
            budgetMax={gig.budgetMax}
            budgetCurrency={gig.budgetCurrency}
            estimatedDuration={gig.estimatedDuration}
            deadline={gig.deadline}
          />

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <Button
                asChild
                className="w-full min-h-[44px] touch-action-manipulation"
              >
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                  Посмотреть отклики
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="w-full min-h-[44px] touch-action-manipulation"
              >
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
                >
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Редактировать
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full min-h-[44px] touch-action-manipulation"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Поделиться
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задание?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить задание «{gig.title}». Все отклики на это
              задание также будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Удаление…" : "Удалить задание"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
