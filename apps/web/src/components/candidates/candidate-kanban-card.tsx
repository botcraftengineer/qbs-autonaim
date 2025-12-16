"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  cn,
} from "@qbs-autonaim/ui";
import { Calendar, Linkedin, Mail, Phone, Star } from "lucide-react";
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
    <div className="bg-card border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 flex flex-col group relative">
      <div className="flex items-center justify-end gap-1 px-3 py-2 border-b">
        <MatchScoreCircle score={candidate.matchScore} size="sm" />
      </div>

      <button
        onClick={onClick}
        className="flex-1 p-3 cursor-pointer text-left focus:outline-none"
        type="button"
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

      {/* Quick Actions - Visible on hover, absolute positioned to prevent layout shift */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/90 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10">
        {candidate.telegram && (
          <a
            href={`https://t.me/${candidate.telegram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-[#2AABEE] transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={`Telegram: ${candidate.telegram}`}
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 fill-current"
            >
              <title>Telegram</title>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
        )}
        {candidate.email && (
          <a
            href={`mailto:${candidate.email}`}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={candidate.email}
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
        {candidate.phone && (
          <a
            href={`tel:${candidate.phone}`}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={candidate.phone}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        {candidate.linkedin && (
          <a
            href={candidate.linkedin}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-[#0a66c2] transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
