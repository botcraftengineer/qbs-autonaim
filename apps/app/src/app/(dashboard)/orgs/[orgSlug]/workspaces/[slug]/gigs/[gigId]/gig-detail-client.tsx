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
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
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
    return `${formatAmount(min)} - ${formatAmount(max)} ${currency}`;
  }

  if (min) {
    return `от ${formatAmount(min)} ${currency}`;
  }

  if (max) {
    return `до ${formatAmount(max)} ${currency}`;
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
  } = useWorkspace();
  const workspaceId = workspace?.id;

  const {
    data: gig,
    isPending,
    error,
  } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

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

  if (workspaceLoading || isPending) {
    return <GigDetailSkeleton />;
  }

  if (error || !gig || !workspace || !organization) {
    notFound();
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    const url = `${window.location.origin}/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Ссылка скопирована в буфер обмена");
      })
      .catch(() => {
        toast.error("Не удалось скопировать ссылку");
      });
  };

  const handleSettings = () => {
    // TODO: Implement settings functionality
    toast.info("Функция «Настройки» скоро будет доступна");
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!workspaceId) return;
    deleteMutation.mutate({ gigId, workspaceId });
  };

  if (isPending) {
    return <GigDetailSkeleton />;
  }

  if (error || !gig) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-6xl py-4 px-4 sm:py-6 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-action-manipulation min-h-[44px] sm:min-h-[24px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заданиям
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Header Card */}
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
                  <CardTitle className="text-xl sm:text-2xl break-words">
                    {gig.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Создано {formatDate(gig.createdAt)}
                    {gig.updatedAt && gig.updatedAt !== gig.createdAt && (
                      <span className="hidden sm:inline">
                        {" "}
                        • Обновлено {formatDate(gig.updatedAt)}
                      </span>
                    )}
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Открыть меню"
                      className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] touch-action-manipulation"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Открыть меню</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Поделиться
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleSettings}>
                      <Settings className="h-4 w-4 mr-2" />
                      Настройки
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={handleDeleteClick}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {gig.description && (
              <CardContent className="p-4 sm:p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap break-words text-sm sm:text-base">
                    {gig.description}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Requirements Card */}
          {gig.requirements && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Требования</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {gig.requirements.summary && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      Описание
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {gig.requirements.summary}
                    </p>
                  </div>
                )}

                {gig.requirements.deliverables &&
                  gig.requirements.deliverables.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">
                        Что нужно сделать
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {gig.requirements.deliverables.map((item: string) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-primary mt-1 flex-shrink-0">
                              •
                            </span>
                            <span className="break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {gig.requirements.required_skills &&
                  gig.requirements.required_skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">
                        Обязательные навыки
                      </h4>
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
                    </div>
                  )}

                {gig.requirements.nice_to_have_skills &&
                  gig.requirements.nice_to_have_skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">
                        Желательные навыки
                      </h4>
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
                    </div>
                  )}

                {gig.requirements.tech_stack &&
                  gig.requirements.tech_stack.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">
                        Технологии
                      </h4>
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
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* External Link */}
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
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть на {gig.source}
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Interview Settings */}
          <GigInterviewSettings gigId={gigId} />

          {/* Invitation Template */}
          <GigInvitationTemplate gigId={gigId} gigTitle={gig.title} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Просмотры
                </div>
                <span className="font-medium">{gig.views || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Отклики
                </div>
                <span className="font-medium">{gig.responses || 0}</span>
              </div>

              {(gig.newResponses || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Новые отклики
                  </div>
                  <Badge variant="default">{gig.newResponses}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Детали проекта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  Бюджет
                </div>
                <p className="font-medium text-sm sm:text-base break-words">
                  {formatBudget(
                    gig.budgetMin,
                    gig.budgetMax,
                    gig.budgetCurrency || "RUB",
                  )}
                </p>
              </div>

              {gig.estimatedDuration && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    Длительность
                  </div>
                  <p className="font-medium text-sm sm:text-base break-words">
                    {gig.estimatedDuration}
                  </p>
                </div>
              )}

              {gig.deadline && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    Дедлайн
                  </div>
                  <p className="font-medium text-sm sm:text-base">
                    {formatDate(gig.deadline)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
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
                  <MessageSquare className="h-4 w-4 mr-2" />
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
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full min-h-[44px] touch-action-manipulation"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Поделиться
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
