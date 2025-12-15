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
import { useState } from "react";
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

  const newCandidates = candidates?.filter((c) => c.stage === "NEW") ?? [];
  const inReview = candidates?.filter((c) => c.stage === "REVIEW") ?? [];
  const interview = candidates?.filter((c) => c.stage === "INTERVIEW") ?? [];
  const hired = candidates?.filter((c) => c.stage === "HIRED") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 p-5 bg-card rounded-lg border shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Select value={selectedVacancy} onValueChange={setSelectedVacancy}>
              <SelectTrigger className="w-[280px] h-10 gap-2 bg-background">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
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
            <Separator orientation="vertical" className="h-8" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, навыкам или должности…"
                className="pl-9 h-10 bg-background"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
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
            <TabsTrigger value="board" className="px-4">
              Доска
            </TabsTrigger>
            <TabsTrigger value="table" className="px-4">
              Таблица
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeView === "board" ? (
        <div className="flex gap-5 overflow-x-auto pb-6">
          <FunnelColumn
            title="Новые кандидаты"
            count={newCandidates.length}
            candidates={newCandidates}
            onCardClick={handleCardClick}
            isLoading={isLoading}
          />
          <FunnelColumn
            title="На рассмотрении"
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
          candidates={candidates ?? []}
          onRowClick={handleCardClick}
        />
      )}

      <CandidateModal
        candidate={selectedCandidate}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
