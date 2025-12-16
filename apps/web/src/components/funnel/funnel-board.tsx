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
import { Briefcase, Search, SlidersHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { CandidateModal } from "./candidate-modal";
import { CandidatesTable } from "./candidates-table";
import { FunnelColumn } from "./funnel-column";
import type { FunnelCandidate } from "./types";

export function FunnelBoard() {
  const params = useParams<{ workspaceSlug: string }>();
  const [selectedVacancy, setSelectedVacancy] = useState<string>("all");
  const [activeView, setActiveView] = useState<"board" | "table">("board");
  const [selectedCandidate, setSelectedCandidate] =
    useState<FunnelCandidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const trpc = useTRPC();

  const { data: vacancies } = useQuery({
    ...trpc.vacancy.listActive.queryOptions({
      workspaceId: params.workspaceSlug,
    }),
  });

  const { data: candidates, isLoading } = useQuery({
    ...trpc.funnel.list.queryOptions({
      workspaceId: params.workspaceSlug,
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
    }),
  });

  const handleCardClick = (candidate: FunnelCandidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const filteredCandidates = useMemo(() => {
    const items = candidates?.items ?? [];
    if (items.length === 0) return [];
    const query = searchText.trim().toLowerCase();
    if (!query) return items;

    const terms = query.split(/\s+/).filter(Boolean);
    return items.filter((c) => {
      const searchable = [
        c.name.toLowerCase(),
        c.position.toLowerCase(),
        ...c.skills.map((s) => s.toLowerCase()),
      ].join(" ");
      return terms.every((term) => searchable.includes(term));
    });
  }, [candidates, searchText]);

  const newCandidates = filteredCandidates.filter((c) => c.stage === "NEW");
  const inReview = filteredCandidates.filter((c) => c.stage === "REVIEW");
  const interview = filteredCandidates.filter((c) => c.stage === "INTERVIEW");
  const hired = filteredCandidates.filter((c) => c.stage === "HIRED");

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
                placeholder="Поиск…"
                className="pl-9 h-10 bg-background"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                aria-label="Поиск кандидатов по имени, навыкам или должности"
                type="search"
                autoComplete="off"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 px-4 w-full sm:w-auto"
            disabled
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as "board" | "table")}
        >
          <TabsList className="h-10">
            <TabsTrigger value="board" className="px-3 sm:px-4">
              Доска
            </TabsTrigger>
            <TabsTrigger value="table" className="px-3 sm:px-4">
              Таблица
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeView === "board" ? (
        <div className="flex gap-3 md:gap-5 overflow-x-auto pb-4 md:pb-6 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
          <FunnelColumn
            title="Новые"
            count={newCandidates.length}
            candidates={newCandidates}
            onCardClick={handleCardClick}
            isLoading={isLoading}
          />
          <FunnelColumn
            title="Рассмотрение"
            count={inReview.length}
            candidates={inReview}
            onCardClick={handleCardClick}
            isLoading={isLoading}
          />
          <FunnelColumn
            title="Собеседование"
            count={interview.length}
            candidates={interview}
            onCardClick={handleCardClick}
            isLoading={isLoading}
          />
          <FunnelColumn
            title="Наняты"
            count={hired.length}
            candidates={hired}
            onCardClick={handleCardClick}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <CandidatesTable
          candidates={filteredCandidates}
          onRowClick={handleCardClick}
        />
      )}

      <CandidateModal
        candidate={selectedCandidate}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        workspaceId={params.workspaceSlug}
      />
    </div>
  );
}
