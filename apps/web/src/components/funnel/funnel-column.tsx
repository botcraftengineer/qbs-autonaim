"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { CandidateCard } from "./candidate-card";
import type { FunnelCandidate } from "./types";

interface FunnelColumnProps {
  title: string;
  count: number;
  candidates: FunnelCandidate[];
  onCardClick: (candidate: FunnelCandidate) => void;
  isLoading?: boolean;
}

export function FunnelColumn({
  title,
  count,
  candidates,
  onCardClick,
  isLoading,
}: FunnelColumnProps) {
  return (
    <div className="flex-shrink-0 w-[340px]">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{title}</span>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              {count}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет кандидатов
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCardClick(candidate)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
