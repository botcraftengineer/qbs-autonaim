"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, Separator } from "@qbs-autonaim/ui";
import { Award, Banknote, Clock, FileText } from "lucide-react";

interface ScreeningData {
  score: number;
  detailedScore: number;
  analysis: string | null;
  priceAnalysis?: string | null;
  deliveryAnalysis?: string | null;
}

interface ScreeningResultsCardProps {
  screening: ScreeningData;
}

export function ScreeningResultsCard({ screening }: ScreeningResultsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          Результаты скрининга
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Автоматическая оценка соответствия кандидата требованиям
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Score Overview */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Общая оценка
              </span>
              <span className="text-xl sm:text-2xl font-bold">
                {screening.score}/5
              </span>
            </div>
            <Progress
              value={((screening.score ?? 0) / 5) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Детальная оценка
              </span>
              <span className="text-xl sm:text-2xl font-bold">
                {screening.detailedScore}/100
              </span>
            </div>
            <Progress
              value={screening.detailedScore ?? 0}
              className="h-2"
            />
          </div>
        </div>

        <Separator />

        {/* Analysis Details */}
        <div className="space-y-3 sm:space-y-4">
          {screening.analysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Анализ портфолио
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                {screening.analysis}
              </p>
            </div>
          )}

          {screening.priceAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Анализ цены
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                {screening.priceAnalysis}
              </p>
            </div>
          )}

          {screening.deliveryAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Анализ сроков
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                {screening.deliveryAnalysis}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}