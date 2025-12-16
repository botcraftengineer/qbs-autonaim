"use client";

import { cn } from "@qbs-autonaim/ui";
import { Users } from "lucide-react";
import { CandidateKanbanCard } from "./candidate-kanban-card";
import type { FunnelCandidate } from "./types";

interface CandidateKanbanColumnProps {
  title: string;
  color: string;
  candidates: FunnelCandidate[];
  onCardClick: (candidate: FunnelCandidate) => void;
  isLoading?: boolean;
}

export function CandidateKanbanColumn({
  title,
  color,
  candidates,
  onCardClick,
  isLoading,
}: CandidateKanbanColumnProps) {
  return (
    <fieldset className="flex flex-col min-w-0 border-0 p-0 m-0">
      <legend className="sr-only">{`Колонка ${title}`}</legend>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums ml-auto shrink-0">
          {candidates.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[300px] p-3 rounded-xl border-2 border-dashed border-transparent bg-muted/30">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-muted animate-pulse rounded-lg"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-40" aria-hidden="true" />
            <p className="text-sm">Нет кандидатов</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateKanbanCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => onCardClick(candidate)}
            />
          ))
        )}
      </div>
    </fieldset>
  );
}
