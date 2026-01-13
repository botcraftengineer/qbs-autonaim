"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShortlistList } from "~/components/gig/shortlist-list";
import { useTRPC } from "~/trpc/react";

interface ShortlistPageClientProps {
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
}

const MIN_SCORE_OPTIONS = [
  { value: "70", label: "От 70 (рекомендуется)" },
  { value: "60", label: "От 60" },
  { value: "50", label: "От 50" },
  { value: "0", label: "Все оценки" },
] as const;

export function ShortlistPageClient({
  orgSlug,
  workspaceSlug,
  gigId,
}: ShortlistPageClientProps) {
  const _router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedMinScore, setSelectedMinScore] = useState<string>("70");
  const [includeOnlyHighlyRecommended, setIncludeOnlyHighlyRecommended] =
    useState<boolean>(false);
  const [prioritizeBudgetFit, setPrioritizeBudgetFit] = useState<boolean>(false);

  // Fetch shortlist candidates
  const {
    data: shortlistData,
    isLoading,
    error,
  } = useQuery(
    trpc.gig.shortlist.queryOptions({
      gigId,
      workspaceId: workspaceSlug,
      minScore: Number.parseInt(selectedMinScore, 10),
      maxCandidates: 20, // Fixed limit for shortlist
      includeOnlyHighlyRecommended,
      prioritizeBudgetFit,
    }),
  );

  // Recalculate shortlist mutation
  const { mutate: recalculateShortlist, isPending: isRecalculating } =
    useMutation(
      trpc.gig.recalculateShortlist.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.gig.shortlist.queryKey({
              gigId,
              workspaceId: workspaceSlug,
            }),
          });
          toast.success("Шортлист пересчитан");
        },
        onError: () => {
          toast.error("Ошибка пересчета шортлиста");
        },
      }),
    );

  const handleRecalculate = () => {
    recalculateShortlist({
      gigId,
      workspaceId: workspaceSlug,
    });
  };

  const handleExportCSV = () => {
    if (!shortlistData?.candidates.length) {
      toast.error("Нет данных для экспорта");
      return;
    }

    try {
      const headers = [
        "Место",
        "Имя",
        "Общая оценка",
        "Оценка цены",
        "Оценка сроков",
        "Оценка навыков",
        "Оценка опыта",
        "Рекомендация",
        "Предложенная цена",
        "Сроки выполнения",
        "Email",
        "Телефон",
        "Telegram",
        "Ключевые преимущества",
        "Недостатки",
      ];

      const rows = shortlistData.candidates.map((candidate, index) => [
        String(index + 1),
        candidate.name,
        String(candidate.compositeScore),
        candidate.priceScore ? String(candidate.priceScore) : "—",
        candidate.deliveryScore ? String(candidate.deliveryScore) : "—",
        candidate.skillsMatchScore ? String(candidate.skillsMatchScore) : "—",
        candidate.experienceScore ? String(candidate.experienceScore) : "—",
        getRecommendationLabel(candidate.recommendation),
        candidate.proposedPrice ? String(candidate.proposedPrice) : "—",
        candidate.proposedDeliveryDays ? String(candidate.proposedDeliveryDays) : "—",
        candidate.contactInfo.email || "—",
        candidate.contactInfo.phone || "—",
        candidate.contactInfo.telegram || "—",
        candidate.strengths.join("; "),
        candidate.weaknesses.join("; "),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([`\uFEFF${csvContent}`], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gig-shortlist-${gigId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Шортлист экспортирован");
    } catch {
      toast.error("Ошибка экспорта");
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case "HIGHLY_RECOMMENDED":
        return "Настоятельно рекомендован";
      case "RECOMMENDED":
        return "Рекомендован";
      case "NEUTRAL":
        return "Нейтрально";
      case "NOT_RECOMMENDED":
        return "Не рекомендован";
      default:
        return recommendation;
    }
  };

  const candidates = shortlistData?.candidates ?? [];
  const totalCandidates = shortlistData?.totalCandidates ?? 0;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Назад к заданию
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Шортлист кандидатов
          </h1>
          <p className="text-sm text-muted-foreground">
            Топ-кандидаты на основе AI-анализа и ранжирования
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            variant="outline"
            size="sm"
            className="gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`}
            />
            {isRecalculating ? "Пересчет…" : "Пересчитать"}
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={!candidates.length}
            className="gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
          >
            <Download className="h-4 w-4" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      {!isLoading && shortlistData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Статистика шортлиста</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Кандидатов в шортлисте
                </p>
                <p className="text-2xl font-bold">{candidates.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Всего ранжированных
                </p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {totalCandidates}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Настоятельно рекомендованы
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {
                    candidates.filter(
                      (c) => c.recommendation === "HIGHLY_RECOMMENDED",
                    ).length
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Средняя оценка</p>
                <p className="text-2xl font-bold">
                  {candidates.length > 0
                    ? Math.round(
                        candidates.reduce((sum, c) => sum + c.compositeScore, 0) /
                          candidates.length,
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Настройки шортлиста
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="min-score-filter"
                className="text-sm font-medium"
              >
                Минимальная оценка
              </label>
              <Select
                value={selectedMinScore}
                onValueChange={setSelectedMinScore}
              >
                <SelectTrigger
                  id="min-score-filter"
                  className="min-h-[44px] sm:min-h-[36px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MIN_SCORE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">
                Только настоятельно рекомендованные
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="highly-recommended-filter"
                  checked={includeOnlyHighlyRecommended}
                  onCheckedChange={setIncludeOnlyHighlyRecommended}
                />
                <label
                  htmlFor="highly-recommended-filter"
                  className="text-sm text-muted-foreground"
                >
                  {includeOnlyHighlyRecommended ? "Включено" : "Отключено"}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">
                Приоритет соответствию бюджету
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="budget-fit-filter"
                  checked={prioritizeBudgetFit}
                  onCheckedChange={setPrioritizeBudgetFit}
                />
                <label
                  htmlFor="budget-fit-filter"
                  className="text-sm text-muted-foreground"
                >
                  {prioritizeBudgetFit ? "Включено" : "Отключено"}
                </label>
              </div>
            </div>
          </div>

          {(selectedMinScore !== "70" ||
            includeOnlyHighlyRecommended ||
            prioritizeBudgetFit) && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Применены фильтры
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMinScore("70");
                  setIncludeOnlyHighlyRecommended(false);
                  setPrioritizeBudgetFit(false);
                }}
              >
                Сбросить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки</AlertTitle>
          <AlertDescription>
            Не удалось загрузить шортлист кандидатов. Попробуйте обновить
            страницу.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {/* Shortlist List */}
      {!isLoading && !error && (
        <ShortlistList
          candidates={candidates}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          gigId={gigId}
        />
      )}
    </div>
  );
}