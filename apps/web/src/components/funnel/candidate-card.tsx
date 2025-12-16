"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
} from "@qbs-autonaim/ui";
import { Briefcase, Calendar, MapPin, Star } from "lucide-react";
import { MatchScoreCircle } from "./match-score-circle";
import type { FunnelCandidate } from "./types";

interface CandidateCardProps {
  candidate: FunnelCandidate;
  onClick: () => void;
}

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
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
    <Card
      className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/40"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
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
            <h3 className="font-semibold text-sm leading-tight truncate">
              {candidate.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {candidate.position}
            </p>
          </div>
          <MatchScoreCircle score={candidate.matchScore} />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-primary/60" />
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary/60" />
            <span className="font-medium truncate">{candidate.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
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
            >
              +{candidate.skills.length - 4}
            </Badge>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between pt-0.5">
          <Badge
            variant="outline"
            className={`text-xs font-medium px-2.5 py-1 h-auto border ${getAvailabilityColor()}`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {getAvailabilityText()}
          </Badge>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold">
              {candidate.salaryExpectation}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
