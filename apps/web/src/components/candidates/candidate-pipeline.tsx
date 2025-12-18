"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";
import { CandidateKanbanCard } from "./candidate-kanban-card";
import { CandidateKanbanColumn } from "./candidate-kanban-column";
import { CandidateModal } from "./candidate-modal";
import { CandidatesTable } from "./candidates-table";
import type { FunnelCandidate, FunnelStage } from "./types";

const STAGES: { id: FunnelStage; title: string; color: string }[] = [
  { id: "SCREENING_DONE", title: "Скрининг выполнен", color: "bg-blue-500" },
  { id: "CHAT_INTERVIEW", title: "Чат Интервью", color: "bg-cyan-500" },
  { id: "OFFER_SENT", title: "Оффер отправлен", color: "bg-indigo-500" },
  { id: "SECURITY_PASSED", title: "СБ пройдена", color: "bg-violet-500" },
  { id: "CONTRACT_SENT", title: "Договор отправлен", color: "bg-amber-500" },
  { id: "ONBOARDING", title: "Онбординг", color: "bg-emerald-500" },
  { id: "REJECTED", title: "Отказ/Не подходит", color: "bg-rose-500" },
];

const pluralizeCandidate = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "кандидатов";
  if (mod10 === 1) return "кандидат";
  if (mod10 >= 2 && mod10 <= 4) return "кандидата";
  return "кандидатов";
};

export function CandidatePipeline() {
  const { workspaceId } = useWorkspaceContext();
  const [selectedVacancy, setSelectedVacancy] = useState<string>("all");
  const [activeView, setActiveView] = useState<"board" | "table">("board");
  const [selectedCandidate, setSelectedCandidate] =
    useState<FunnelCandidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStages, setFilterStages] = useState<FunnelStage[]>([]);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const trpc = useTRPC();

  /* DND State & Handlers */
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const queryClient = useQueryClient();

  // Состояние для пагинации каждой колонки
  const [stageLimits, setStageLimits] = useState<Record<FunnelStage, number>>(
    () => {
      const initial: Record<FunnelStage, number> = {} as Record<
        FunnelStage,
        number
      >;
      STAGES.forEach((stage) => {
        initial[stage.id] = 5;
      });
      return initial;
    },
  );

  // Загружаем данные для каждой колонки отдельно
  const screeningDoneQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["SCREENING_DONE"],
      limit: stageLimits.SCREENING_DONE,
    }),
    enabled: !!workspaceId,
  });

  const chatInterviewQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["CHAT_INTERVIEW"],
      limit: stageLimits.CHAT_INTERVIEW,
    }),
    enabled: !!workspaceId,
  });

  const offerSentQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["OFFER_SENT"],
      limit: stageLimits.OFFER_SENT,
    }),
    enabled: !!workspaceId,
  });

  const securityPassedQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["SECURITY_PASSED"],
      limit: stageLimits.SECURITY_PASSED,
    }),
    enabled: !!workspaceId,
  });

  const contractSentQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["CONTRACT_SENT"],
      limit: stageLimits.CONTRACT_SENT,
    }),
    enabled: !!workspaceId,
  });

  const onboardingQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["ONBOARDING"],
      limit: stageLimits.ONBOARDING,
    }),
    enabled: !!workspaceId,
  });

  const rejectedQuery = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["REJECTED"],
      limit: stageLimits.REJECTED,
    }),
    enabled: !!workspaceId,
  });

  const stageQueries = [
    {
      stage: "SCREENING_DONE" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["SCREENING_DONE"],
        limit: stageLimits.SCREENING_DONE,
      }).queryKey,
      query: screeningDoneQuery,
    },
    {
      stage: "CHAT_INTERVIEW" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["CHAT_INTERVIEW"],
        limit: stageLimits.CHAT_INTERVIEW,
      }).queryKey,
      query: chatInterviewQuery,
    },
    {
      stage: "OFFER_SENT" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["OFFER_SENT"],
        limit: stageLimits.OFFER_SENT,
      }).queryKey,
      query: offerSentQuery,
    },
    {
      stage: "SECURITY_PASSED" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["SECURITY_PASSED"],
        limit: stageLimits.SECURITY_PASSED,
      }).queryKey,
      query: securityPassedQuery,
    },
    {
      stage: "CONTRACT_SENT" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["CONTRACT_SENT"],
        limit: stageLimits.CONTRACT_SENT,
      }).queryKey,
      query: contractSentQuery,
    },
    {
      stage: "ONBOARDING" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["ONBOARDING"],
        limit: stageLimits.ONBOARDING,
      }).queryKey,
      query: onboardingQuery,
    },
    {
      stage: "REJECTED" as FunnelStage,
      queryKey: trpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["REJECTED"],
        limit: stageLimits.REJECTED,
      }).queryKey,
      query: rejectedQuery,
    },
  ];

  const updateStageMutation = useMutation(
    trpc.candidates.updateStage.mutationOptions({
      onMutate: async (newStageData) => {
        // Отменяем все запросы для колонок
        await Promise.all(
          stageQueries.map((sq) =>
            queryClient.cancelQueries({ queryKey: sq.queryKey }),
          ),
        );

        const previousData: Record<string, unknown> = {};

        // Сохраняем предыдущие данные для всех колонок
        stageQueries.forEach((sq) => {
          const data = queryClient.getQueryData(sq.queryKey);
          if (data) {
            previousData[sq.stage] = data;
          }
        });

        // Оптимистично обновляем данные
        const oldStage = stageQueries.find((sq) => {
          const data = sq.query.data;
          return data?.items.some((c) => c.id === newStageData.candidateId);
        });

        if (oldStage) {
          // Удаляем из старой колонки
          queryClient.setQueryData(oldStage.queryKey, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.filter(
                (c: FunnelCandidate) => c.id !== newStageData.candidateId,
              ),
            };
          });

          // Добавляем в новую колонку
          const newStageQuery = stageQueries.find(
            (sq) => sq.stage === newStageData.stage,
          );
          if (newStageQuery) {
            const candidate = oldStage.query.data?.items.find(
              (c) => c.id === newStageData.candidateId,
            );
            if (candidate) {
              queryClient.setQueryData(newStageQuery.queryKey, (old: any) => {
                if (!old) return old;
                return {
                  ...old,
                  items: [
                    { ...candidate, stage: newStageData.stage },
                    ...old.items,
                  ],
                };
              });
            }
          }
        }

        return { previousData };
      },
      onError: (_err, _newStageData, context) => {
        if (context?.previousData) {
          // Восстанавливаем предыдущие данные
          Object.entries(context.previousData).forEach(([stage, data]) => {
            const sq = stageQueries.find((q) => q.stage === stage);
            if (sq) {
              queryClient.setQueryData(sq.queryKey, data as any);
            }
          });
        }
      },
      onSettled: () => {
        // Инвалидируем все запросы колонок
        stageQueries.forEach((sq) => {
          queryClient.invalidateQueries({ queryKey: sq.queryKey });
        });
      },
    }),
  );

  const loadMoreForStage = useCallback((stage: FunnelStage) => {
    setStageLimits((prev) => ({
      ...prev,
      [stage]: prev[stage] + 5,
    }));
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as FunnelStage;

    // Находим кандидата в любой из колонок
    let candidate: FunnelCandidate | undefined;
    for (const sq of stageQueries) {
      candidate = sq.query.data?.items.find((c) => c.id === candidateId);
      if (candidate) break;
    }

    if (!candidate || candidate.stage === newStage) return;

    updateStageMutation.mutate({
      workspaceId: workspaceId ?? "",
      candidateId,
      stage: newStage,
    });
  };

  const { data: vacancies } = useQuery({
    ...trpc.vacancy.listActive.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  // Собираем всех кандидатов из всех колонок для DragOverlay и поиска
  const allCandidates = useMemo(() => {
    const all: FunnelCandidate[] = [];
    stageQueries.forEach((sq) => {
      if (sq.query.data?.items) {
        all.push(...sq.query.data.items);
      }
    });
    return all;
  }, [stageQueries]);

  const isLoading = stageQueries.some((sq) => sq.query.isLoading);

  const handleCardClick = useCallback((candidate: FunnelCandidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  }, []);

  const toggleStageFilter = (stageId: FunnelStage) => {
    setFilterStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  };

  // Для таблицы используем все загруженные кандидаты
  const filteredCandidates = allCandidates;

  // Для канбана используем данные из отдельных запросов
  const candidatesByStage = useMemo(() => {
    const result: Record<
      FunnelStage,
      { items: FunnelCandidate[]; hasMore: boolean; total: number }
    > = {
      SCREENING_DONE: { items: [], hasMore: false, total: 0 },
      CHAT_INTERVIEW: { items: [], hasMore: false, total: 0 },
      OFFER_SENT: { items: [], hasMore: false, total: 0 },
      SECURITY_PASSED: { items: [], hasMore: false, total: 0 },
      CONTRACT_SENT: { items: [], hasMore: false, total: 0 },
      ONBOARDING: { items: [], hasMore: false, total: 0 },
      REJECTED: { items: [], hasMore: false, total: 0 },
    };

    stageQueries.forEach((sq) => {
      if (sq.query.data) {
        result[sq.stage] = {
          items: sq.query.data.items,
          hasMore: !!sq.query.data.nextCursor,
          total: sq.query.data.total ?? sq.query.data.items.length,
        };
      }
    });

    return result;
  }, [stageQueries]);

  const totalCount = useMemo(() => {
    return Object.values(candidatesByStage).reduce(
      (sum, stage) => sum + stage.total,
      0,
    );
  }, [candidatesByStage]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6">
        <div className="flex flex-col gap-3 p-3 sm:p-4 md:p-5 bg-card rounded-lg border shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-1">
              <Select
                value={selectedVacancy}
                onValueChange={setSelectedVacancy}
              >
                <SelectTrigger className="w-full sm:w-[240px] md:w-[280px] h-10 gap-2 bg-background">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Все вакансии" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все вакансии</SelectItem>
                  {vacancies?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Separator
                orientation="vertical"
                className="hidden sm:block h-8"
              />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени, должности, навыкам…"
                  className="pl-9 h-10 bg-background"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  aria-label="Поиск кандидатов"
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-10 px-4"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Фильтры</span>
                    {filterStages.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1.5 py-0.5 h-5 text-[10px] min-w-5 justify-center text-foreground font-semibold"
                      >
                        {filterStages.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-foreground">
                        Статус
                      </h4>
                      {filterStages.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setFilterStages([])}
                        >
                          Сбросить
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {STAGES.map((stage) => (
                        <div
                          key={stage.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`filter-${stage.id}`}
                            checked={filterStages.includes(stage.id)}
                            onCheckedChange={() => toggleStageFilter(stage.id)}
                          />
                          <Label
                            htmlFor={`filter-${stage.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {stage.title}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button size="sm" className="gap-2 h-10 px-4" disabled>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Добавить</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6">
          <div className="flex items-center justify-between gap-4">
            <Tabs
              value={activeView}
              onValueChange={(v) => setActiveView(v as "board" | "table")}
            >
              <TabsList className="h-10">
                <TabsTrigger value="board" className="gap-2 px-3 sm:px-4">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Доска</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2 px-3 sm:px-4">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Таблица</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-sm text-muted-foreground tabular-nums">
              {totalCount > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {totalCount}
                  </span>{" "}
                  {pluralizeCandidate(totalCount)}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeView === "board" ? (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="h-full overflow-x-auto px-4 md:px-6 lg:px-8">
                <section
                  className="flex gap-3 md:gap-4 min-w-max h-full pb-4"
                  aria-label="Канбан-доска кандидатов"
                >
                  {STAGES.map((stage) => {
                    const stageData = candidatesByStage[stage.id];
                    const stageQuery = stageQueries.find(
                      (sq) => sq.stage === stage.id,
                    );
                    return (
                      <CandidateKanbanColumn
                        key={stage.id}
                        id={stage.id}
                        title={stage.title}
                        color={stage.color}
                        candidates={stageData.items}
                        total={stageData.total}
                        hasMore={stageData.hasMore}
                        onCardClick={handleCardClick}
                        onLoadMore={() => loadMoreForStage(stage.id)}
                        isLoading={stageQuery?.query.isLoading ?? false}
                        isLoadingMore={stageQuery?.query.isFetching ?? false}
                      />
                    );
                  })}
                </section>
              </div>
              <DragOverlay>
                {(() => {
                  const candidate = allCandidates.find(
                    (c) => c.id === activeId,
                  );
                  return activeId && candidate ? (
                    <CandidateKanbanCard
                      candidate={candidate}
                      onClick={() => {}}
                    />
                  ) : null;
                })()}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="h-full overflow-auto px-4 md:px-6 lg:px-8">
              <CandidatesTable
                candidates={filteredCandidates}
                onRowClick={handleCardClick}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>

        <CandidateModal
          candidate={selectedCandidate}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          workspaceId={workspaceId ?? ""}
        />
      </div>
    </div>
  );
}
