"use client";

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { MapPin, Star } from "lucide-react";
import type { FunnelCandidate, FunnelStage } from "../funnel/types";
import { STAGE_COLORS, STAGE_LABELS } from "../funnel/types";

interface CandidatesTableProps {
  candidates: FunnelCandidate[];
  onRowClick: (candidate: FunnelCandidate) => void;
}

export function CandidatesTable({
  candidates,
  onRowClick,
}: CandidatesTableProps) {
  const getStageText = (stage: string) =>
    STAGE_LABELS[stage as FunnelStage] ?? stage;
  const getStageColor = (stage: string) =>
    STAGE_COLORS[stage as FunnelStage] ?? "";

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Нет кандидатов</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Кандидат</TableHead>
            <TableHead>Должность</TableHead>
            <TableHead>Локация</TableHead>
            <TableHead>Навыки</TableHead>
            <TableHead>Совпадение</TableHead>
            <TableHead>Зарплата</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(candidate)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(candidate);
                }
              }}
              aria-label={`Кандидат ${candidate.name}`}
            >
              <TableCell className="font-medium">{candidate.name}</TableCell>
              <TableCell>{candidate.position}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {candidate.location}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      aria-label={`Ещё ${candidate.skills.length - 3} навыков`}
                    >
                      +{candidate.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Star
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span className="font-semibold tabular-nums">
                    {candidate.matchScore}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium tabular-nums">
                {candidate.salaryExpectation}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStageColor(candidate.stage)}
                >
                  {getStageText(candidate.stage)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
