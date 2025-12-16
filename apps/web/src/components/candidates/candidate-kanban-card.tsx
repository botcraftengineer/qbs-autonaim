"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  cn,
} from "@qbs-autonaim/ui";
import { Calendar, Star } from "lucide-react";
import { MatchScoreCircle } from "./match-score-circle";
import type { FunnelCandidate } from "./types";

interface CandidateKanbanCardProps {
  candidate: FunnelCandidate;
  onClick: () => void;
}

export function CandidateKanbanCard({
  candidate,
  onClick,
}: CandidateKanbanCardProps) {
  const getAvailabilityColor = () => {
    if (candidate.availability === "IMMEDIATE")
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
    if (candidate.availability === "TWO_WEEKS")
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  };

  const getAvailabilityText = () => {
    if (candidate.availability === "IMMEDIATE") return "Сразу";
    if (candidate.availability === "TWO_WEEKS") return "2 нед.";
    return "1 мес.";
  };

  const getMatchScoreColor = () => {
    if (candidate.matchScore >= 70)
      return "text-emerald-600 dark:text-emerald-400";
    if (candidate.matchScore >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm transition-all duration-200 select-none hover:shadow-md hover:border-primary/30">
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <span className="text-xs text-muted-foreground truncate flex-1">
          {candidate.vacancyName}
        </span>
        <MatchScoreCircle score={candidate.matchScore} size="sm" />
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-full p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-b-lg"
        aria-label={`Открыть профиль ${candidate.name}`}
      >
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 border shrink-0">
            <AvatarImage
              src={candidate.avatar ?? undefined}
              alt={candidate.name}
            />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {candidate.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight truncate">
              {candidate.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {candidate.position}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.slice(0, 3).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-[10px] font-medium px-1.5 py-0 h-5 truncate max-w-[70px]"
            >
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > 3 && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium px-1.5 py-0 h-5"
              title={candidate.skills.slice(3).join(", ")}
            >
              +{candidate.skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 h-auto border",
              getAvailabilityColor(),
            )}
          >
            <Calendar className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
            {getAvailabilityText()}
          </Badge>
          <div className="flex items-center gap-1">
            <Star
              className={cn(
                "h-3 w-3",
                candidate.matchScore >= 70
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/50",
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                getMatchScoreColor(),
              )}
            >
              {candidate.matchScore}%
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
