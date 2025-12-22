"use client";

import {
  Badge,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@qbs-autonaim/ui";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface VacancyStatsProps {
  totalVacancies: number;
  activeVacancies: number;
  totalResponses: number;
  newResponses: number;
  isLoading?: boolean;
}

export function VacancyStats({
  totalVacancies,
  activeVacancies,
  totalResponses,
  newResponses,
  isLoading,
}: VacancyStatsProps) {
  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => `skeleton-${index}`).map(
          (key) => (
            <Card key={key} className="@container/card animate-pulse">
              <CardHeader>
                <CardDescription>Загрузка…</CardDescription>
                <CardTitle className="text-2xl font-semibold">—</CardTitle>
              </CardHeader>
            </Card>
          ),
        )}
      </div>
    );
  }

  const activePercentage =
    totalVacancies > 0
      ? Math.round((activeVacancies / totalVacancies) * 100)
      : 0;

  const avgResponsesPerVacancy =
    activeVacancies > 0 ? Math.round(totalResponses / activeVacancies) : 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Всего вакансий</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalVacancies}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {activeVacancies} активных
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Активные вакансии</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeVacancies}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                activePercentage >= 50
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
              )}
            >
              {activePercentage >= 50 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {activePercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">от общего числа</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Всего откликов</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                newResponses > 0
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-zinc-500/50 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
              )}
            >
              {newResponses > 0 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {newResponses} новых
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">по всем вакансиям</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Средний отклик</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgResponsesPerVacancy}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">откликов на вакансию</div>
        </CardFooter>
      </Card>
    </div>
  );
}
