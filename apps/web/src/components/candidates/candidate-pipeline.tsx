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
  { id: "NEW", title: "Новые", color: "bg-blue-500" },
  { id: "REVIEW", title: "Рассмотрение", color: "bg-amber-500" },
  { id: "INTERVIEW", title: "Собеседование", color: "bg-purple-500" },
  { id: "OFFER", title: "Оффер", color: "bg-indigo-500" },
  { id: "HIRED", title: "Наняты", color: "bg-emerald-500" },
  { id: "REJECTED", title: "Отказ", color: "bg-rose-500" },
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
  const listQueryOptions = trpc.candidates.list.queryOptions({
    workspaceId: workspaceId ?? "",
    vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
    search: debouncedSearch || undefined,
    stages: filterStages.length > 0 ? filterStages : undefined,
    limit: 100,
  });
  const listQueryKey = listQueryOptions.queryKey;

  const updateStageMutation = useMutation(
    trpc.candidates.updateStage.mutationOptions({
      onMutate: async (newStageData) => {
        await queryClient.cancelQueries({ queryKey: listQueryKey });
        const previousData = queryClient.getQueryData(
          listQueryKey,
        ) as typeof candidates;

        if (previousData) {
          queryClient.setQueryData(listQueryKey, (old: typeof candidates) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((c) =>
                c.id === newStageData.candidateId
                  ? { ...c, stage: newStageData.stage }
                  : c,
              ),
            };
          });
        }
        return { previousData };
      },
      onError: (_err, _newStageData, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(listQueryKey, context.previousData);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: listQueryKey });
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as FunnelStage;

    const candidate = allCandidates.find((c) => c.id === candidateId);
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

  // Используем обычный query с увеличенным лимитом и фильтрацией на сервере
  const { data: candidates, isLoading } = useQuery({
    ...listQueryOptions,
    enabled: !!workspaceId,
  });

  const allCandidates = useMemo(() => candidates?.items ?? [], [candidates]);

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

  // Фильтрация теперь на сервере, просто используем все кандидаты
  const filteredCandidates = allCandidates;

  const candidatesByStage = useMemo(() => {
    const result: Record<FunnelStage, FunnelCandidate[]> = {
      NEW: [],
      REVIEW: [],
      INTERVIEW: [],
      OFFER: [],
      HIRED: [],
      REJECTED: [],
    };
    for (const c of filteredCandidates) {
      const stage = c.stage as FunnelStage;
      if (result[stage]) {
        result[stage].push(c);
      }
    }
    return result;
  }, [filteredCandidates]);

  const totalCount = filteredCandidates.length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 p-3 sm:p-4 md:p-5 bg-card rounded-lg border shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-1">
            <Select value={selectedVacancy} onValueChange={setSelectedVacancy}>
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
            <Separator orientation="vertical" className="hidden sm:block h-8" />
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
                <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
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
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              {pluralizeCandidate(totalCount)}
              {candidates?.nextCursor && (
                <span className="ml-2 text-xs">
                  (показаны первые {totalCount})
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>

      {activeView === "board" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6"
            aria-label="Канбан-доска кандидатов"
          >
            {STAGES.map((stage) => (
              <CandidateKanbanColumn
                key={stage.id}
                id={stage.id}
                title={stage.title}
                color={stage.color}
                candidates={candidatesByStage[stage.id]}
                onCardClick={handleCardClick}
                isLoading={isLoading}
              />
            ))}
          </section>
          <DragOverlay>
            {(() => {
              const candidate = allCandidates.find((c) => c.id === activeId);
              return activeId && candidate ? (
                <CandidateKanbanCard candidate={candidate} onClick={() => {}} />
              ) : null;
            })()}
          </DragOverlay>
        </DndContext>
      ) : (
        <CandidatesTable
          candidates={filteredCandidates}
          onRowClick={handleCardClick}
          isLoading={isLoading}
        />
      )}

      <CandidateModal
        candidate={selectedCandidate}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workspaceId={workspaceId ?? ""}
      />
    </div>
  );
}
