"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@qbs-autonaim/ui";
import { Calendar, MapPin, Star } from "lucide-react";
import { MatchScoreCircle } from "../funnel/match-score-circle";
import type { FunnelCandidate } from "../funnel/types";

interface CandidateKanbanCardProps {
  candidate: FunnelCandidate;
  onClick: () => void;
}

export function CandidateKanbanCard({
  candidate,
  onClick,
}: CandidateKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: candidate.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getAvailabilityColor = () => {
    if (candidate.availability === "IMMEDIATE")
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
    if (candidate.availability === "TWO_WEEKS")
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  };

  const getAvailabilityText = () => {
    if (candidate.availability === "IMMEDIATE") return "Сразу";
    if (candidate.availability === "TWO_WEEKS") return "2 недели";
    return "1 месяц";
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-card border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow touch-action-manipulation text-left w-full"
      aria-label={`Кандидат ${candidate.name}, ${candidate.position}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-11 w-11 border-2 border-muted ring-1 ring-border/30">
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
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {candidate.position}
          </p>
        </div>
        <MatchScoreCircle score={candidate.matchScore} />
      </div>

      <div className="h-px bg-border mb-3" aria-hidden="true" />

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <MapPin
          className="h-3.5 w-3.5 text-primary/60 shrink-0"
          aria-hidden="true"
        />
        <span className="font-medium truncate">{candidate.location}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {candidate.skills.slice(0, 4).map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="text-[10px] font-medium px-2 py-0.5 h-auto"
          >
            {skill}
          </Badge>
        ))}
        {candidate.skills.length > 4 && (
          <Badge
            variant="outline"
            className="text-[10px] font-medium px-2 py-0.5 h-auto"
            title={`Ещё ${candidate.skills.length - 4} навыков`}
          >
            +{candidate.skills.length - 4}
          </Badge>
        )}
      </div>

      <div className="h-px bg-border mb-3" aria-hidden="true" />

      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`text-xs font-medium px-2.5 py-1 h-auto border ${getAvailabilityColor()}`}
        >
          <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
          {getAvailabilityText()}
        </Badge>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Star
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold tabular-nums">
            {candidate.salaryExpectation}
          </span>
        </div>
      </div>
    </button>
  );
}
