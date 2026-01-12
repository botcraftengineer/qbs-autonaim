"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Progress,
} from "@qbs-autonaim/ui";
import {
  Award,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type GigResponseListItem = RouterOutputs["gig"]["responses"]["list"][number];

// Extend the type to include interviewScoring relation
type GigResponseWithInterviewScoring = GigResponseListItem & {
  interviewScoring?: {
    id: string;
    conversationId: string;
    responseId: string | null;
    gigResponseId: string | null;
    score: number;
    detailedScore: number;
    analysis: string | null;
    createdAt: Date;
  } | null;
};

interface ResponseListCardProps {
  response: GigResponseWithInterviewScoring;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept?: (responseId: string) => void;
  onReject?: (responseId: string) => void;
  onMessage?: (responseId: string) => void;
}

const STATUS_CONFIG = {
  NEW: { label: "Новый", variant: "default" as const, icon: FileText },
  EVALUATED: {
    label: "Оценен",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  INTERVIEW: {
    label: "Интервью",
    variant: "default" as const,
    icon: MessageSquare,
  },
  NEGOTIATION: {
    label: "Переговоры",
    variant: "outline" as const,
    icon: TrendingUp,
  },
  COMPLETED: {
    label: "Завершен",
    variant: "secondary" as const,
    icon: CheckCircle2,
  },
  SKIPPED: {
    label: "Пропущен",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const HR_STATUS_CONFIG = {
  INVITE: { label: "Пригласить", variant: "default" as const },
  RECOMMENDED: { label: "Рекомендован", variant: "secondary" as const },
  NOT_RECOMMENDED: { label: "Не рекомендован", variant: "outline" as const },
  REJECTED: { label: "Отклонен", variant: "destructive" as const },
  SELECTED: { label: "Выбран", variant: "default" as const },
  OFFER: { label: "Оффер", variant: "default" as const },
  SECURITY_PASSED: { label: "СБ пройдена", variant: "secondary" as const },
  CONTRACT_SENT: { label: "Контракт отправлен", variant: "secondary" as const },
  IN_PROGRESS: { label: "В работе", variant: "default" as const },
  ONBOARDING: { label: "Онбординг", variant: "default" as const },
  DONE: { label: "Выполнено", variant: "secondary" as const },
};

const IMPORT_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Вручную",
  KWORK: "Kwork",
  FL_RU: "FL.ru",
  FREELANCE_RU: "Freelance.ru",
  HH_API: "HeadHunter",
  WEB_LINK: "Веб-ссылка",
  TELEGRAM: "Telegram",
  HH: "HeadHunter",
  AVITO: "Avito",
  SUPERJOB: "SuperJob",
  HABR: "Хабр Карьера",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatCurrency(amount: number | null) {
  if (!amount) return null;
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function ResponseListCard({
  response,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
}: ResponseListCardProps) {
  const statusConfig = STATUS_CONFIG[response.status];
  const StatusIcon = statusConfig.icon;
  const hasScreening = !!response.screening;
  const hasInterviewScoring = !!response.interviewScoring;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Link
      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${response.id}`}
    >
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                <User className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base truncate">
                    {response.candidateName || response.candidateId}
                  </h3>

                  {response.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {response.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(response.respondedAt || response.createdAt)}
                    </span>
                  </div>

                  {response.importSource &&
                    response.importSource !== "MANUAL" && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>
                          {IMPORT_SOURCE_LABELS[response.importSource]}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge variant={statusConfig.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>

              {response.hrSelectionStatus && (
                <Badge
                  variant={HR_STATUS_CONFIG[response.hrSelectionStatus].variant}
                  className="text-xs"
                >
                  {HR_STATUS_CONFIG[response.hrSelectionStatus].label}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Screening Score */}
          {hasScreening && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Оценка скрининга
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {response.screening.score}/5 •{" "}
                      {response.screening.detailedScore}/100
                    </span>
                  </div>
                  <Progress
                    value={response.screening.detailedScore}
                    className="h-1.5"
                  />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" align="start">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Результаты скрининга
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Автоматическая оценка соответствия требованиям
                    </p>
                  </div>

                  {response.screening.analysis && (
                    <div>
                      <h5 className="text-xs font-medium mb-1">Анализ</h5>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {response.screening.analysis}
                      </p>
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}

          {/* Interview Scoring */}
          {hasInterviewScoring && response.interviewScoring && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Оценка интервью
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {response.interviewScoring.score}/5 •{" "}
                      {response.interviewScoring.detailedScore}/100
                    </span>
                  </div>
                  <Progress
                    value={response.interviewScoring.detailedScore}
                    className="h-1.5"
                  />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" align="start">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Результаты интервью
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Оценка кандидата на основе AI-интервью
                    </p>
                  </div>

                  {response.interviewScoring.analysis && (
                    <div>
                      <h5 className="text-xs font-medium mb-1">Анализ</h5>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {response.interviewScoring.analysis}
                      </p>
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}

          {/* Parsed Profile Indicator */}
          {response.profileData && !response.profileData.error && (
            <div className="p-3 rounded-lg border bg-background">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Портфолио распарсено</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {response.profileData.platform || "Не указан"} •{" "}
                    {response.profileData.username || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {response.proposedPrice && (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Цена</div>
                  <div className="font-medium truncate">
                    {formatCurrency(response.proposedPrice)}
                  </div>
                </div>
              </div>
            )}

            {response.proposedDeliveryDays && (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Срок</div>
                  <div className="font-medium truncate">
                    {response.proposedDeliveryDays}{" "}
                    {response.proposedDeliveryDays === 1
                      ? "день"
                      : response.proposedDeliveryDays < 5
                        ? "дня"
                        : "дней"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cover Letter Preview */}
          {response.coverLetter && (
            <div className="p-3 rounded-lg border bg-background">
              <div className="flex items-start gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-xs font-medium">
                  Сопроводительное письмо
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {response.coverLetter}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {onAccept && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={(e) => handleAction(e, () => onAccept(response.id))}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Принять
              </Button>
            )}

            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={(e) => handleAction(e, () => onMessage(response.id))}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Написать
              </Button>
            )}

            {onReject && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 ml-auto"
                onClick={(e) => handleAction(e, () => onReject(response.id))}
              >
                <XCircle className="h-3.5 w-3.5" />
                Отклонить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
