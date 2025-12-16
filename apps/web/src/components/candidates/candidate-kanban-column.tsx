"use client";

import { useDroppable } from "@dnd-kit/core";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import type { FunnelCandidate } from "../funnel/types";
import { CandidateKanbanCard } from "./candidate-kanban-card";

interface CandidateKanbanColumnProps {
  id: string;
  title: string;
  candidates: FunnelCandidate[];
  onCardClick: (candidate: FunnelCandidate) => void;
  isLoading?: boolean;
}

export function CandidateKanbanColumn({
  id,
  title,
  candidates,
  onCardClick,
  isLoading,
}: CandidateKanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col w-[320px] shrink-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground touch-action-manipulation"
            aria-label="Drag column"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">
            {candidates.length}
          </span>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground touch-action-manipulation"
          aria-label="Column options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-3 min-h-[200px] p-3 bg-muted/30 rounded-lg"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Нет кандидатов
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

        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors touch-action-manipulation"
        >
          <Plus className="w-4 h-4" />
          Добавить кандидата
        </button>
      </div>
    </div>
  );
}
