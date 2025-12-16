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
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  Star,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidate } from "../types";
import { ContactInfo } from "./contact-info";
import { ProfessionalInfo } from "./professional-info";
import { SkillsSection } from "./skills-section";

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
    ...trpc.funnel.updateStage.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.funnel.list.queryKey() });
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

  const getMatchScoreColor = () => {
    if (candidate.matchScore >= 80)
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (candidate.matchScore >= 50)
      return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getAvailabilityText = () => {
    if (candidate.availability === "IMMEDIATE") return "Доступен сразу";
    if (candidate.availability === "TWO_WEEKS") return "Через 2 недели";
    return "Через месяц";
  };

  const getAvailabilityColor = () => {
    if (candidate.availability === "IMMEDIATE")
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (candidate.availability === "TWO_WEEKS")
      return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1600px] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Avatar className="h-20 w-20 border-2 border-primary/20 ring-4 ring-primary/5 shrink-0">
                  <AvatarImage
                    src={candidate.avatar ?? undefined}
                    alt={candidate.name}
                  />
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    {candidate.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <DialogTitle className="text-3xl font-bold leading-tight">
                      {candidate.name}
                    </DialogTitle>
                    <p className="text-lg text-muted-foreground mt-1 font-medium">
                      {candidate.position}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`text-sm font-semibold px-3 py-1.5 border ${getMatchScoreColor()}`}
                    >
                      <Award className="h-4 w-4 mr-1.5" />
                      {candidate.matchScore}% совпадение
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-sm font-semibold px-3 py-1.5 border ${getAvailabilityColor()}`}
                    >
                      <Clock className="h-4 w-4 mr-1.5" />
                      {getAvailabilityText()}
                    </Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      <Briefcase className="h-4 w-4 mr-1.5" />
                      {candidate.vacancyName}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                >
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
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Закрыть"
                  onClick={() => onOpenChange(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Локация
                  </span>
                </div>
                <p className="text-base font-semibold">{candidate.location}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Ожидания
                  </span>
                </div>
                <p className="text-base font-semibold tabular-nums">
                  {candidate.salaryExpectation}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Подал заявку
                  </span>
                </div>
                <p className="text-base font-semibold">
                  {new Date(candidate.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Обновлено
                  </span>
                </div>
                <p className="text-base font-semibold">
                  {new Date(candidate.updatedAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Результаты скрининга
                    </h3>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Общая оценка соответствия
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold tabular-nums">
                            {candidate.matchScore}
                          </span>
                          <span className="text-2xl font-semibold text-muted-foreground">
                            / 100
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={`star-${candidate.id}-${i}`}
                            className={`h-8 w-8 ${
                              i < Math.round(candidate.matchScore / 20)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <Progress value={candidate.matchScore} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {candidate.matchScore >= 80
                          ? "Отличное соответствие"
                          : candidate.matchScore >= 60
                            ? "Хорошее соответствие"
                            : candidate.matchScore >= 40
                              ? "Среднее соответствие"
                              : "Низкое соответствие"}
                      </span>
                      <span className="text-muted-foreground">
                        {candidate.matchScore >= 80
                          ? "Рекомендуется к собеседованию"
                          : candidate.matchScore >= 60
                            ? "Требуется дополнительная оценка"
                            : "Не соответствует требованиям"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />
                <ContactInfo candidate={candidate} />
                <Separator />
                <ProfessionalInfo candidate={candidate} />
                <Separator />
                <SkillsSection skills={candidate.skills} />
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Ключевые метрики
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Технические навыки (примерно)
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {Math.min(100, candidate.matchScore + 5)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, candidate.matchScore + 5)}
                        className="h-2"
                      />
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Опыт работы (примерно)
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {Math.max(0, candidate.matchScore - 10)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.max(0, candidate.matchScore - 10)}
                        className="h-2"
                      />
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Зарплатные ожидания (примерно)
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {Math.min(100, candidate.matchScore + 15)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, candidate.matchScore + 15)}
                        className="h-2"
                      />
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Доступность
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {candidate.availability === "IMMEDIATE"
                            ? "100%"
                            : candidate.availability === "TWO_WEEKS"
                              ? "85%"
                              : "70%"}
                        </span>
                      </div>
                      <Progress
                        value={
                          candidate.availability === "IMMEDIATE"
                            ? 100
                            : candidate.availability === "TWO_WEEKS"
                              ? 85
                              : 70
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Рекомендация системы
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {candidate.matchScore >= 80
                          ? "Кандидат отлично подходит для данной позиции. Рекомендуется пригласить на собеседование."
                          : candidate.matchScore >= 60
                            ? "Кандидат соответствует большинству требований. Рекомендуется дополнительная оценка."
                            : "Кандидат частично соответствует требованиям. Требуется детальный анализ."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Одобрить
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Отклонить
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Написать
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Закрыть
                </Button>
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Скачать резюме
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
