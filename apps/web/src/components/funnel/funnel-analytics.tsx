"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Award,
  Briefcase,
  Clock,
  Filter,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

interface FunnelStageData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export function FunnelAnalytics() {
  const params = useParams<{ workspaceSlug: string }>();
  const [timeRange, setTimeRange] = useState("30d");
  const trpc = useTRPC();

  const { data: analytics, isLoading } = useQuery({
    ...trpc.funnel.analytics.queryOptions({
      workspaceId: params.workspaceSlug,
    }),
  });

  const { data: vacancyStats } = useQuery({
    ...trpc.funnel.vacancyStats.queryOptions({
      workspaceId: params.workspaceSlug,
    }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const total = analytics?.totalCandidates ?? 0;
  const funnelStages: FunnelStageData[] = [
    {
      name: "Новые кандидаты",
      count: analytics?.byStage.NEW ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.NEW ?? 0) / total) * 100)
          : 0,
      color: "bg-blue-500",
    },
    {
      name: "На рассмотрении",
      count: analytics?.byStage.REVIEW ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.REVIEW ?? 0) / total) * 100)
          : 0,
      color: "bg-amber-500",
    },
    {
      name: "Собеседование",
      count: analytics?.byStage.INTERVIEW ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.INTERVIEW ?? 0) / total) * 100)
          : 0,
      color: "bg-purple-500",
    },
    {
      name: "Наняты",
      count: analytics?.byStage.HIRED ?? 0,
      percentage:
        total > 0
          ? Math.round(((analytics?.byStage.HIRED ?? 0) / total) * 100)
          : 0,
      color: "bg-emerald-500",
    },
  ];

  const overallConversion =
    total > 0
      ? (((analytics?.byStage.HIRED ?? 0) / total) * 100).toFixed(1)
      : "0";

  const statusStats = [
    {
      label: "Всего кандидатов",
      count: analytics?.totalCandidates ?? 0,
      icon: Users,
      trend: `+${analytics?.newThisWeek ?? 0}`,
      trendUp: true,
      description: "за эту неделю",
    },
    {
      label: "В процессе",
      count:
        (analytics?.byStage.NEW ?? 0) +
        (analytics?.byStage.REVIEW ?? 0) +
        (analytics?.byStage.INTERVIEW ?? 0),
      icon: Clock,
      trendUp: true,
      description: "активные кандидаты",
    },
    {
      label: "Наняты",
      count: analytics?.hired ?? 0,
      icon: UserCheck,
      trendUp: true,
      description: "успешно наняты",
    },
    {
      label: "Отклонены",
      count: analytics?.byStage.REJECTED ?? 0,
      icon: UserX,
      trendUp: false,
      description: "не прошли отбор",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Аналитика найма
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Детальная статистика процесса найма
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Последние 7 дней</SelectItem>
            <SelectItem value="30d">Последние 30 дней</SelectItem>
            <SelectItem value="90d">Последние 3 месяца</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {stat.trend && (
                  <>
                    {stat.trendUp ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        stat.trendUp ? "text-emerald-500" : "text-red-500"
                      }
                    >
                      {stat.trend}
                    </span>
                  </>
                )}
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px] h-10">
          <TabsTrigger value="funnel">Воронка</TabsTrigger>
          <TabsTrigger value="conversion">Конверсия</TabsTrigger>
          <TabsTrigger value="vacancies">Вакансии</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <FunnelStagesCard
            stages={funnelStages}
            overallConversion={overallConversion}
          />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <ConversionCards
            stages={funnelStages}
            analytics={analytics}
            overallConversion={overallConversion}
          />
        </TabsContent>

        <TabsContent value="vacancies" className="space-y-4">
          <VacancyStatsCard vacancyStats={vacancyStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FunnelStagesCard({
  stages,
  overallConversion,
}: {
  stages: FunnelStageData[];
  overallConversion: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Воронка найма
            </CardTitle>
            <CardDescription className="mt-1.5">
              Прохождение кандидатов по этапам
            </CardDescription>
          </div>
          <Badge variant="secondary" className="h-7 px-3">
            Конверсия: {overallConversion}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const prevStage = index > 0 ? stages[index - 1] : null;
            const dropOff = prevStage ? prevStage.count - stage.count : 0;
            const conversionFromPrev =
              prevStage && prevStage.count > 0
                ? ((stage.count / prevStage.count) * 100).toFixed(0)
                : null;

            return (
              <div key={stage.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${stage.color}`} />
                    <div>
                      <div className="font-semibold">{stage.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {stage.percentage}% от общего
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stage.count}</div>
                    {conversionFromPrev && (
                      <div className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {conversionFromPrev}% конверсия
                      </div>
                    )}
                  </div>
                </div>
                <Progress value={stage.percentage} className="h-3" />
                {prevStage && dropOff > 0 && (
                  <div className="flex items-center justify-between text-xs pl-5">
                    <span className="text-muted-foreground">
                      Отсев:{" "}
                      <span className="font-medium text-red-600">
                        {dropOff}
                      </span>{" "}
                      кандидатов
                    </span>
                  </div>
                )}
                {index < stages.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsData {
  totalCandidates: number;
  hired: number;
  newThisWeek: number;
  byStage: Record<string, number>;
}

function ConversionCards({
  stages,
  analytics,
  overallConversion,
}: {
  stages: FunnelStageData[];
  analytics: AnalyticsData | undefined;
  overallConversion: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Статистика по этапам
          </CardTitle>
          <CardDescription>Распределение кандидатов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.name}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-8 rounded-full ${stage.color}`} />
                <span className="font-medium text-sm">{stage.name}</span>
              </div>
              <Badge variant="secondary">{stage.count} кандидатов</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Ключевые метрики
          </CardTitle>
          <CardDescription>Показатели эффективности</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Общая конверсия</span>
            </div>
            <Badge variant="secondary">{overallConversion}%</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Новых за неделю</span>
            </div>
            <Badge variant="secondary">{analytics?.newThisWeek ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-sm">Успешно наняты</span>
            </div>
            <Badge className="bg-emerald-500">{analytics?.hired ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <UserX className="h-4 w-4 text-red-500" />
              <span className="font-medium text-sm">Отклонено</span>
            </div>
            <Badge variant="destructive">
              {analytics?.byStage.REJECTED ?? 0}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface VacancyStat {
  vacancyId: string;
  vacancyName: string;
  total: number;
  inProcess: number;
  hired: number;
}

function VacancyStatsCard({
  vacancyStats,
}: {
  vacancyStats: VacancyStat[] | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Статистика по вакансиям
        </CardTitle>
        <CardDescription>Кандидаты по открытым позициям</CardDescription>
      </CardHeader>
      <CardContent>
        {!vacancyStats || vacancyStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Нет данных по вакансиям</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vacancyStats.map((vacancy) => (
              <div
                key={vacancy.vacancyId}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <h4 className="font-semibold">{vacancy.vacancyName}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Всего: {vacancy.total}</span>
                    <span>•</span>
                    <span>В работе: {vacancy.inProcess}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">
                      Наняты: {vacancy.hired}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {vacancy.total > 0
                      ? ((vacancy.hired / vacancy.total) * 100).toFixed(0)
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-muted-foreground">конверсия</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
