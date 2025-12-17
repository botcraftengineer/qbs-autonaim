"use client";

import { Avatar, AvatarFallback, AvatarImage, Badge } from "@qbs-autonaim/ui";
import { MapPin } from "lucide-react";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { MatchScoreCircle } from "./match-score-circle";
import type { FunnelCandidate } from "./types";

interface CandidateCardProps {
  candidate: FunnelCandidate;
  onClick: () => void;
}

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
  const avatarUrl = useAvatarUrl(candidate.avatarFileId);

  return (
    <button
      type="button"
      className="bg-card border rounded-lg shadow-lg p-3 w-[280px] cursor-grabbing text-left"
      onClick={onClick}
      aria-label={`Кандидат ${candidate.name}`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={candidate.name} />
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {candidate.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{candidate.name}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {candidate.position}
          </p>
        </div>
        <MatchScoreCircle score={candidate.matchScore} size="sm" />
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 2).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </button>
  );
}
