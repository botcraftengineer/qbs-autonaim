"use client";

import {
  Badge,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@qbs-autonaim/ui";
import {
  IconBriefcase,
  IconChartBar,
  IconMessageCircle,
  IconTrendingDown,
  IconTrendingUp,
  IconUserCheck,
} from "@tabler/icons-react";

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
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => `skeleton-${index}`).map(
          (key) => (
            <Card key={key} className="animate-pulse border-none bg-muted/20">
              <CardHeader className="h-[120px]" />
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

  const stats = [
    {
      title: "Всего вакансий",
      value: totalVacancies,
      description: `${activeVacancies} активных сейчас`,
      icon: IconBriefcase,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Активные",
      value: activeVacancies,
      description: `${activePercentage}% от всех`,
      icon: IconChartBar,
      color: "text-green-600",
      bg: "bg-green-500/10",
      action: (
        <Badge
          variant="outline"
          className={cn(
            "border-none px-1.5",
            activePercentage >= 50
              ? "bg-green-500/10 text-green-700"
              : "bg-red-500/10 text-red-700",
          )}
        >
          {activePercentage >= 50 ? (
            <IconTrendingUp className="size-3.5 mr-1" />
          ) : (
            <IconTrendingDown className="size-3.5 mr-1" />
          )}
          {activePercentage}%
        </Badge>
      ),
    },
    {
      title: "Отклики",
      value: totalResponses,
      description: `+${newResponses} новых`,
      icon: IconMessageCircle,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      action: newResponses > 0 && (
        <Badge
          variant="outline"
          className="border-none bg-purple-500/10 text-purple-700 px-1.5"
        >
          <IconTrendingUp className="size-3.5 mr-1" />
          Новые
        </Badge>
      ),
    },
    {
      title: "Эффективность",
      value: avgResponsesPerVacancy,
      description: "откликов на вакансию",
      icon: IconUserCheck,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="group relative overflow-hidden border-none bg-card shadow-sm transition-all hover:shadow-md"
        >
          <div
            className={cn(
              "absolute right-0 top-0 -mr-4 -mt-4 size-24 transform rounded-full opacity-10 transition-transform group-hover:scale-110",
              stat.bg,
            )}
          />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <stat.icon className={cn("size-5", stat.color)} />
              {stat.action}
            </div>
            <CardTitle className="mt-4 text-3xl font-bold tracking-tight">
              {stat.value.toLocaleString()}
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              {stat.title}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <p className="text-sm text-muted-foreground">{stat.description}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
