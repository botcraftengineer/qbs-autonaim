"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui";
import { Award, Trophy } from "lucide-react";
import { ShortlistCandidateCard } from "./shortlist-candidate-card";

type ShortlistCandidate = RouterOutputs["gig"]["shortlist"]["candidates"][number];

interface ShortlistListProps {
  candidates: ShortlistCandidate[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

export function ShortlistList({
  candidates,
  orgSlug,
  workspaceSlug,
  gigId,
}: ShortlistListProps) {
  if (candidates.length === 0) {
    return (
      <Alert>
        <Award className="h-4 w-4" />
        <AlertTitle>Шортлист пуст</AlertTitle>
        <AlertDescription>
          Нет кандидатов, соответствующих критериям шортлиста. Попробуйте изменить настройки фильтрации.
        </AlertDescription>
      </Alert>
    );
  }

  // Разделяем кандидатов на топ-3 и остальных для визуального выделения
  const topThree = candidates.slice(0, 3);
  const others = candidates.slice(3);

  return (
    <div className="space-y-6">
      {/* Top 3 Candidates Section */}
      {topThree.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Топ-кандидаты</h2>
            <span className="text-sm text-muted-foreground">
              ({topThree.length})
            </span>
          </div>

          <div className="space-y-4">
            {topThree.map((candidate, index) => (
              <ShortlistCandidateCard
                key={candidate.responseId}
                candidate={candidate}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                gigId={gigId}
                rank={index + 1}
                isTopCandidate={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Candidates Section */}
      {others.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Другие кандидаты</h2>
            <span className="text-sm text-muted-foreground">
              ({others.length})
            </span>
          </div>

          <div className="space-y-4">
            {others.map((candidate, index) => (
              <ShortlistCandidateCard
                key={candidate.responseId}
                candidate={candidate}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                gigId={gigId}
                rank={index + 4} // Начинаем с 4-го места
                isTopCandidate={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}