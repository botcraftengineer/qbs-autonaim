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
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";

type ShortlistCandidate = RouterOutputs["gig"]["shortlist"]["candidates"][number];

interface ShortlistCandidateCardProps {
  candidate: ShortlistCandidate;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  rank: number;
  isTopCandidate: boolean;
}

const RECOMMENDATION_CONFIG = {
  HIGHLY_RECOMMENDED: {
    label: "Настоятельно рекомендован",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  RECOMMENDED: {
    label: "Рекомендован",
    variant: "secondary" as const,
    icon: Star,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  NEUTRAL: {
    label: "Нейтрально",
    variant: "outline" as const,
    icon: TrendingUp,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  NOT_RECOMMENDED: {
    label: "Не рекомендован",
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
} as const;

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export function ShortlistCandidateCard({
  candidate,
  orgSlug,
  workspaceSlug,
  gigId,
  rank,
  isTopCandidate,
}: ShortlistCandidateCardProps) {
  const recommendation = RECOMMENDATION_CONFIG[candidate.recommendation];
  const RecommendationIcon = recommendation.icon;

  return (
    <Card className={`transition-all duration-200 ${isTopCandidate ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-lg ${
                isTopCandidate
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {rank}
              </div>
            </div>

            {/* Candidate Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">
                  {candidate.name}
                </h3>
                <Badge variant={recommendation.variant} className="gap-1">
                  <RecommendationIcon className="h-3 w-3" />
                  {recommendation.label}
                </Badge>
              </div>

              {/* Composite Score */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium">Общая оценка:</span>
                <span className={`text-xl font-bold ${getScoreColor(candidate.compositeScore)}`}>
                  {candidate.compositeScore}
                </span>
              </div>

              {/* Budget Info */}
              {(candidate.proposedPrice || candidate.proposedDeliveryDays) && (
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {candidate.proposedPrice && (
                    <div className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      <span>{candidate.proposedPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  {candidate.proposedDeliveryDays && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{candidate.proposedDeliveryDays} дней</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${candidate.responseId}`}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Открыть</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Detailed Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {candidate.priceScore !== undefined && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Цена</div>
              <div className={`text-lg font-semibold ${getScoreColor(candidate.priceScore)}`}>
                {candidate.priceScore}
              </div>
            </div>
          )}
          {candidate.deliveryScore !== undefined && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Сроки</div>
              <div className={`text-lg font-semibold ${getScoreColor(candidate.deliveryScore)}`}>
                {candidate.deliveryScore}
              </div>
            </div>
          )}
          {candidate.skillsMatchScore !== undefined && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Навыки</div>
              <div className={`text-lg font-semibold ${getScoreColor(candidate.skillsMatchScore)}`}>
                {candidate.skillsMatchScore}
              </div>
            </div>
          )}
          {candidate.experienceScore !== undefined && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Опыт</div>
              <div className={`text-lg font-semibold ${getScoreColor(candidate.experienceScore)}`}>
                {candidate.experienceScore}
              </div>
            </div>
          )}
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {candidate.strengths.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                Преимущества
              </div>
              <ul className="space-y-1">
                {candidate.strengths.slice(0, 3).map((strength, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {candidate.weaknesses.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                Недостатки
              </div>
              <ul className="space-y-1">
                {candidate.weaknesses.slice(0, 3).map((weakness, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {candidate.contactInfo.email && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{candidate.contactInfo.email}</span>
            </div>
          )}
          {candidate.contactInfo.phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{candidate.contactInfo.phone}</span>
            </div>
          )}
          {candidate.contactInfo.telegram && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span className="truncate max-w-[120px]">@{candidate.contactInfo.telegram}</span>
            </div>
          )}
        </div>

        {/* Portfolio Links */}
        {candidate.portfolioLinks && candidate.portfolioLinks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium mb-2">Портфолио</div>
            <div className="flex flex-wrap gap-2">
              {candidate.portfolioLinks.slice(0, 3).map((link, index) => (
                <Button key={index} variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ссылка {index + 1}
                  </a>
                </Button>
              ))}
              {candidate.portfolioLinks.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +ещё {candidate.portfolioLinks.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}