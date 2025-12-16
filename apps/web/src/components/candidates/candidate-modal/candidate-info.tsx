"use client";

import { Badge, Button } from "@qbs-autonaim/ui";
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Star,
  XCircle,
} from "lucide-react";
import { MatchScoreCircle } from "../match-score-circle";
import type { FunnelCandidate } from "../types";

interface CandidateInfoProps {
  candidate: FunnelCandidate;
  onAction?: (action: string) => void;
}

export function CandidateInfo({ candidate, onAction }: CandidateInfoProps) {
  const getAvailabilityColor = () => {
    if (candidate.availability === "IMMEDIATE")
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
    if (candidate.availability === "TWO_WEEKS")
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Контакты</h3>
          <div className="space-y-3">
            {candidate.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{candidate.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{candidate.location}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Детали</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{candidate.salaryExpectation}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className={`text-xs ${getAvailabilityColor()}`}
              >
                {candidate.availability}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(candidate.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Навыки</h3>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill: string) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Результаты оценки</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <MatchScoreCircle score={candidate.matchScore} size="md" />
            </div>
            <p className="text-xs text-muted-foreground">Общий скор</p>
          </div>

          {candidate.resumeScore !== undefined && (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <MatchScoreCircle score={candidate.resumeScore} size="md" />
              </div>
              <p className="text-xs text-muted-foreground">Скор резюме</p>
            </div>
          )}

          {candidate.interviewScore !== undefined && (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <MatchScoreCircle score={candidate.interviewScore} size="md" />
              </div>
              <p className="text-xs text-muted-foreground">Скор интервью</p>
            </div>
          )}
        </div>
      </div>

      {candidate.scoreAnalysis && (
        <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
          <h3 className="text-sm font-medium mb-2">Анализ оценки</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {candidate.scoreAnalysis}
          </p>
        </div>
      )}

      <div className="border-t pt-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-2"
          onClick={() => onAction?.("send-greeting")}
        >
          <Send className="h-4 w-4" />
          Отправить приветствие
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onAction?.("invite")}
        >
          <CheckCircle className="h-4 w-4" />
          Пригласить
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onAction?.("rate")}
        >
          <Star className="h-4 w-4" />
          Оценить
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onAction?.("view-resume")}
        >
          <FileText className="h-4 w-4" />
          Резюме
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onAction?.("refresh-resume")}
        >
          <RefreshCw className="h-4 w-4" />
          Обновить резюме
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 ml-auto text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onAction?.("reject")}
        >
          <XCircle className="h-4 w-4" />
          Отклонить
        </Button>
      </div>
    </div>
  );
}
