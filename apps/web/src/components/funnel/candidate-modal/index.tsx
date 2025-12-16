"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { MatchScoreCircle } from "../match-score-circle";
import type { FunnelCandidate } from "../types";

interface CandidateModalProps {
  candidate: FunnelCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function CandidateModal({
  candidate,
  open,
  onOpenChange,
  workspaceId,
}: CandidateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(
    candidate?.stage ?? "REVIEW",
  );

  useEffect(() => {
    setSelectedStatus(candidate?.stage ?? "REVIEW");
  }, [candidate?.stage]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateStage = useMutation({
    ...trpc.candidates.updateStage.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      toast.success("Статус обновлен");
    },
    onError: () => {
      toast.error("Не удалось обновить статус");
    },
  });

  if (!candidate) return null;

  const handleStatusChange = (stage: string) => {
    setSelectedStatus(stage);
    updateStage.mutate({
      candidateId: candidate.id,
      workspaceId,
      stage: stage as "NEW" | "REVIEW" | "INTERVIEW" | "HIRED" | "REJECTED",
    });
  };

  const getAvailabilityColor = () => {
    if (candidate.availability === "IMMEDIATE")
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
    if (candidate.availability === "TWO_WEEKS")
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="p-6 pb-4 border-b space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-14 w-14 border-2 shrink-0">
                <AvatarImage
                  src={candidate.avatar ?? undefined}
                  alt={candidate.name}
                />
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {candidate.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-semibold truncate">
                  {candidate.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {candidate.position}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <MatchScoreCircle score={candidate.matchScore} size="md" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Статус:</span>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">Новые</SelectItem>
                <SelectItem value="REVIEW">На рассмотрении</SelectItem>
                <SelectItem value="INTERVIEW">Собеседование</SelectItem>
                <SelectItem value="HIRED">Наняты</SelectItem>
                <SelectItem value="REJECTED">Отклонен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Контакты
                </h3>
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Детали
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {candidate.salaryExpectation}
                    </span>
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
                      {new Date(candidate.createdAt).toLocaleDateString(
                        "ru-RU",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Навыки */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Навыки
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Скоринг */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Результаты оценки
              </h3>
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
                      <MatchScoreCircle
                        score={candidate.resumeScore}
                        size="md"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Скор резюме</p>
                  </div>
                )}

                {candidate.interviewScore !== undefined && (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MatchScoreCircle
                        score={candidate.interviewScore}
                        size="md"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Скор интервью
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Анализ оценки */}
            {candidate.scoreAnalysis && (
              <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                <h3 className="text-sm font-medium mb-2">Анализ оценки</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {candidate.scoreAnalysis}
                </p>
              </div>
            )}

            {/* Действия */}
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-2">
                    <Send className="h-4 w-4" />
                    Отправить приветствие
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Star className="h-4 w-4" />
                    Оценить
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Обновить резюме
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Резюме
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Пригласить
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Написать
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Отклонить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
