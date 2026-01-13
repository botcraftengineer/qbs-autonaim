"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import { skipToken, useQuery } from "@tanstack/react-query";
import {
  Bot,
  Edit,
  MessageSquare,
  Share2,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

type ShortlistCandidate =
  RouterOutputs["gig"]["shortlist"]["candidates"][number];

interface TopCandidatesPreviewProps {
  candidates: ShortlistCandidate[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

function TopCandidatesPreview({
  candidates,
  orgSlug,
  workspaceSlug,
  gigId,
}: TopCandidatesPreviewProps) {
  if (candidates.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "HIGHLY_RECOMMENDED":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
      case "RECOMMENDED":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30";
      case "NEUTRAL":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30";
      default:
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        Топ-кандидаты по версии AI
      </div>

      <div className="grid gap-2">
        {candidates.slice(0, 3).map((candidate, index) => (
          <div
            key={candidate.responseId}
            className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-medium text-sm truncate">
                  {candidate.name}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${getRecommendationColor(candidate.recommendation)}`}
                >
                  {candidate.recommendation === "HIGHLY_RECOMMENDED" &&
                    "Настоятельно"}
                  {candidate.recommendation === "RECOMMENDED" &&
                    "Рекомендуется"}
                  {candidate.recommendation === "NEUTRAL" && "Нейтрально"}
                  {candidate.recommendation === "NOT_RECOMMENDED" &&
                    "Не рекомендуется"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span
                  className={`font-semibold ${getScoreColor(candidate.compositeScore)}`}
                >
                  {candidate.compositeScore} баллов
                </span>
                {candidate.proposedPrice && (
                  <span>
                    {candidate.proposedPrice.toLocaleString("ru-RU")} ₽
                  </span>
                )}
                {candidate.proposedDeliveryDays && (
                  <span>{candidate.proposedDeliveryDays} дней</span>
                )}
              </div>

              {candidate.strengths.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Почему подходит:
                  </span>{" "}
                  {candidate.strengths.slice(0, 2).join(", ")}
                  {candidate.strengths.length > 2 && "..."}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${candidate.responseId}`}
                title="Открыть профиль кандидата"
              >
                <Users className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        asChild
        className="w-full text-xs hover:bg-primary/5 text-primary"
      >
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/shortlist`}
        >
          <Star className="h-3 w-3 mr-2" />
          Посмотреть полный шортлист ({candidates.length} кандидатов)
        </Link>
      </Button>
    </div>
  );
}

interface GigDetailActionsProps {
  gig: {
    title: string;
  };
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  responseCounts?: { total: number; new: number } | null;
  onShare: () => void;
}

export function GigDetailActions({
  gig: _gig,
  orgSlug,
  workspaceSlug,
  gigId,
  responseCounts,
  onShare,
}: GigDetailActionsProps) {
  const trpc = useTRPC();
  const { workspace } = useWorkspace();

  // Получаем топ-3 кандидатов для краткого превью
  const { data: topCandidatesData } = useQuery(
    trpc.gig.shortlist.queryOptions(
      workspace?.id
        ? {
            gigId,
            workspaceId: workspace.id,
            minScore: 70,
            maxCandidates: 3, // Только топ-3 кандидата
            includeOnlyHighlyRecommended: false,
            prioritizeBudgetFit: false,
          }
        : skipToken,
    ),
  );

  const topCandidates = topCandidatesData?.candidates ?? [];

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
      <CardHeader className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-blue-500/10 rounded-t-lg" />
        <CardTitle className="text-xl font-bold relative z-10 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Действия с заданием
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {/* Основные действия */}
        <div className="space-y-3">
          <Button
            asChild
            className="w-full min-h-[48px] touch-manipulation bg-gradient-to-r from-primary via-primary to-purple-600 hover:from-primary/90 hover:via-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/chat`}
              className="flex items-center justify-center relative z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Bot
                className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-200"
                aria-hidden="true"
              />
              <div className="flex flex-col items-start flex-1">
                <span className="font-semibold">AI Помощник</span>
                <span className="text-xs opacity-80">
                  Умный анализ кандидатов
                </span>
              </div>
              <Badge className="ml-auto bg-white/20 text-white border-white/30 hover:bg-white/30 animate-pulse">
                Новинка
              </Badge>
            </Link>
          </Button>

          <Button
            asChild
            variant="default"
            className="w-full min-h-[48px] touch-manipulation bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
              className="flex items-center justify-start relative z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <MessageSquare
                className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-semibold">Посмотреть отклики</span>
                <span className="text-xs opacity-80">
                  Все отклики кандидатов
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                {responseCounts?.total !== undefined && (
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {responseCounts.total}
                  </Badge>
                )}
                {responseCounts?.new !== undefined &&
                  responseCounts.new > 0 && (
                    <Badge
                      variant="destructive"
                      className="bg-orange-500 hover:bg-orange-600 text-white animate-pulse shadow-sm border-0"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />+
                      {responseCounts.new}
                    </Badge>
                  )}
              </div>
            </Link>
          </Button>

          <Button
            asChild
            variant="default"
            className="w-full min-h-[48px] touch-manipulation bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/shortlist`}
              className="flex items-center justify-start relative z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Star
                className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-semibold">Шортлист кандидатов</span>
                <span className="text-xs opacity-80">
                  Лучшие кандидаты по AI
                </span>
              </div>
            </Link>
          </Button>
        </div>

        {/* Топ-кандидаты превью */}
        {topCandidates.length > 0 && (
          <>
            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
            <TopCandidatesPreview
              candidates={topCandidates}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              gigId={gigId}
            />
          </>
        )}

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Второстепенные действия */}
        <div className="space-y-3">
          <Button
            variant="outline"
            asChild
            className="w-full min-h-[44px] touch-manipulation border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
          >
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
              className="flex items-center justify-center"
            >
              <Edit
                className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200"
                aria-hidden="true"
              />
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">Редактировать задание</span>
                <span className="text-xs opacity-70">Изменить условия</span>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full min-h-[44px] touch-manipulation border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
            onClick={onShare}
          >
            <Share2
              className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200"
              aria-hidden="true"
            />
            <div className="flex flex-col items-start flex-1">
              <span className="font-medium">Поделиться ссылкой</span>
              <span className="text-xs opacity-70">Отправить кандидатам</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
