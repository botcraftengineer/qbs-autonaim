"use client";

import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@qbs-autonaim/ui";
import { GigCard, EmptyState } from "./components";
import { IconFilter, IconSearch, IconSparkles } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

const gigTypeLabels: Record<string, string> = {
  DEVELOPMENT: "Разработка",
  DESIGN: "Дизайн",
  COPYWRITING: "Копирайтинг",
  MARKETING: "Маркетинг",
  TRANSLATION: "Перевод",
  VIDEO: "Видео",
  AUDIO: "Аудио",
  DATA_ENTRY: "Ввод данных",
  RESEARCH: "Исследования",
  CONSULTING: "Консалтинг",
  OTHER: "Другое",
};

export default function GigsPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const api = useTRPC();
  const { workspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  const { data: gigs, isLoading } = useQuery({
    ...api.gig.list.queryOptions({
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  const filteredAndSortedGigs = useMemo(() => {
    if (!gigs) return [];

    let filtered = [...gigs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((g) => g.title.toLowerCase().includes(query));
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((g) => g.type === typeFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((g) => g.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((g) => !g.isActive);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "responses":
          return (b.responses ?? 0) - (a.responses ?? 0);
        case "newResponses":
          return (b.newResponses ?? 0) - (a.newResponses ?? 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return filtered;
  }, [gigs, searchQuery, typeFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    if (!gigs) {
      return {
        totalGigs: 0,
        activeGigs: 0,
        totalResponses: 0,
        newResponses: 0,
      };
    }

    return {
      totalGigs: gigs.length,
      activeGigs: gigs.filter((g) => g.isActive).length,
      totalResponses: gigs.reduce((sum, g) => sum + (g.responses ?? 0), 0),
      newResponses: gigs.reduce((sum, g) => sum + (g.newResponses ?? 0), 0),
    };
  }, [gigs]);

  const formatBudget = (
    min?: number | null,
    max?: number | null,
    currency?: string | null,
  ) => {
    if (!min && !max) return "—";
    const curr = currency || "RUB";
    const formatter = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    });
    if (min && max) {
      return `${formatter.format(min)} – ${formatter.format(max)}`;
    }
    if (min) return `от ${formatter.format(min)}`;
    if (max) return `до ${formatter.format(max)}`;
    return "—";
  };

  return (
    <>
      <SiteHeader title="Разовые задания" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Stats */}
            <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Всего заданий</p>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats.totalGigs
                  )}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats.activeGigs
                  )}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Всего откликов</p>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats.totalResponses
                  )}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Новых откликов</p>
                <p className="text-2xl font-bold tabular-nums text-green-600">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats.newResponses
                  )}
                </p>
              </div>
            </div>

            <div className="px-4 lg:px-6">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1 md:max-w-sm">
                    <IconSearch
                      className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      type="search"
                      placeholder="Поиск по названию…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      aria-label="Поиск заданий"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger
                        className="w-full sm:w-[160px]"
                        aria-label="Фильтр по типу"
                      >
                        <IconFilter className="size-4" aria-hidden="true" />
                        <SelectValue placeholder="Тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        {Object.entries(gigTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger
                        className="w-full sm:w-[140px]"
                        aria-label="Фильтр по статусу"
                      >
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="active">Активные</SelectItem>
                        <SelectItem value="inactive">Неактивные</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger
                        className="w-full sm:w-[160px]"
                        aria-label="Сортировка"
                      >
                        <SelectValue placeholder="Сортировка" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">По дате</SelectItem>
                        <SelectItem value="deadline">По дедлайну</SelectItem>
                        <SelectItem value="responses">По откликам</SelectItem>
                        <SelectItem value="newResponses">По новым</SelectItem>
                        <SelectItem value="title">По названию</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex w-full gap-2 md:w-auto">
                  <Button
                    asChild
                    variant="default"
                    className="flex-1 md:flex-initial"
                  >
                    <Link
                      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/create`}
                      aria-label="Создать разовое задание"
                    >
                      <IconSparkles className="size-4" aria-hidden="true" />
                      Создать задание
                    </Link>
                  </Button>
                </div>
              </div>

              {!isLoading && filteredAndSortedGigs.length > 0 && (
                <div className="mb-3 text-sm text-muted-foreground">
                  Найдено заданий:{" "}
                  <span className="font-medium tabular-nums">
                    {filteredAndSortedGigs.length}
                  </span>
                  {(searchQuery ||
                    typeFilter !== "all" ||
                    statusFilter !== "all") &&
                    gigs &&
                    filteredAndSortedGigs.length !== gigs.length && (
                      <span> из {gigs.length}</span>
                    )}
                </div>
              )}

              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="rounded-lg border p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-16 w-full" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedGigs.length === 0 ? (
                <EmptyState
                  orgSlug={orgSlug}
                  workspaceSlug={workspaceSlug}
                  title={
                    searchQuery || typeFilter !== "all" || statusFilter !== "all"
                      ? "Ничего не найдено"
                      : "Нет заданий"
                  }
                  description={
                    searchQuery || typeFilter !== "all" || statusFilter !== "all"
                      ? "Попробуйте изменить параметры поиска"
                      : "Создайте первое разовое задание, чтобы начать поиск исполнителей"
                  }
                  showCreateButton={
                    !searchQuery && typeFilter === "all" && statusFilter === "all"
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedGigs.map((gig) => (
                    <GigCard
                      key={gig.id}
                      gig={gig}
                      orgSlug={orgSlug}
                      workspaceSlug={workspaceSlug}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
