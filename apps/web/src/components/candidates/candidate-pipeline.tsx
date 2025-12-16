"use client";

import {
  Button,
  Input,
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
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";
import { CandidateKanbanColumn } from "./candidate-kanban-column";
import { CandidateModal } from "./candidate-modal";
import { CandidatesTable } from "./candidates-table";
import type { FunnelCandidate, FunnelStage } from "./types";

const STAGES: { id: FunnelStage; title: string; color: string }[] = [
  { id: "NEW", title: "Новые", color: "bg-blue-500" },
  { id: "REVIEW", title: "Рассмотрение", color: "bg-amber-500" },
  { id: "INTERVIEW", title: "Собеседование", color: "bg-purple-500" },
  { id: "HIRED", title: "Наняты", color: "bg-emerald-500" },
  { id: "REJECTED", title: "Отказ", color: "bg-rose-500" },
];

export function CandidatePipeline() {
  const { workspaceId } = useWorkspaceContext();
  const [selectedVacancy, setSelectedVacancy] = useState<string>("all");
  const [activeView, setActiveView] = useState<"board" | "table">("board");
  const [selectedCandidate, setSelectedCandidate] =
    useState<FunnelCandidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const trpc = useTRPC();

  const { data: vacancies } = useQuery({
    ...trpc.vacancy.listActive.queryOptions({
      workspaceId: workspaceId ?? "",
    }),
    enabled: !!workspaceId,
  });

  const { data: candidates, isLoading } = useQuery({
    ...trpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
    }),
    enabled: !!workspaceId,
  });

  const handleCardClick = useCallback((candidate: FunnelCandidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  }, []);

  const filteredCandidates = useMemo(() => {
    const items = candidates?.items ?? [];
    if (items.length === 0) return [];
    const query = searchText.trim().toLowerCase();
    if (!query) return items;

    const terms = query.split(/\s+/).filter(Boolean);
    return items.filter((c) => {
      const skillsLower = c.skills.map((s: string) => s.toLowerCase());
      const searchable = [
        c.name.toLowerCase(),
        c.position.toLowerCase(),
        ...skillsLower,
      ].join(" ");
      return terms.every((term) => searchable.includes(term));
    });
  }, [candidates, searchText]);

  const candidatesByStage = useMemo(() => {
    const result: Record<FunnelStage, FunnelCandidate[]> = {
      NEW: [],
      REVIEW: [],
      INTERVIEW: [],
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-10 px-4"
              disabled
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Фильтры</span>
            </Button>
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
              {totalCount === 1
                ? "кандидат"
                : totalCount < 5
                  ? "кандидата"
                  : "кандидатов"}
            </>
          ) : null}
        </div>
      </div>

      {activeView === "board" ? (
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6"
          aria-label="Канбан-доска кандидатов"
        >
          {STAGES.map((stage) => (
            <CandidateKanbanColumn
              key={stage.id}
              title={stage.title}
              color={stage.color}
              candidates={candidatesByStage[stage.id]}
              onCardClick={handleCardClick}
              isLoading={isLoading}
            />
          ))}
        </section>
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
