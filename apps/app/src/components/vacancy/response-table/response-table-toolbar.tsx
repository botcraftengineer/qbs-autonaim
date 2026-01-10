import type { ResponseStatus } from "@qbs-autonaim/db/schema";
import { Button, Input } from "@qbs-autonaim/ui";
import { Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRefreshVacancyResponsesToken,
  fetchScreenAllResponsesToken,
  fetchScreenNewResponsesToken,
} from "~/actions/realtime";
import {
  ResponseFilters,
  ResponseStatusFilter,
  type ScreeningFilter,
} from "~/components/response";
import { RefreshDialog } from "./refresh-dialog";
import { ScreeningDialog } from "./screening-dialog";
import { useRefreshSubscription } from "./use-refresh-subscription";
import {
  type ScreeningProgress,
  useScreeningSubscription,
} from "./use-screening-subscription";

function getPluralForm(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

interface ResponseTableToolbarProps {
  vacancyId: string;
  totalResponses: number;
  screeningFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
  statusFilter: ResponseStatus[];
  onStatusFilterChange: (statuses: ResponseStatus[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isRefreshing: boolean;
  isProcessingNew: boolean;
  isProcessingAll: boolean;
  onRefresh: () => void;
  onRefreshComplete: () => void;
  onScreenNew: () => void;
  onScreenAll: () => void;
  onScreeningDialogClose: () => void;
}

export function ResponseTableToolbar({
  vacancyId,
  totalResponses,
  screeningFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  isRefreshing,
  isProcessingNew,
  isProcessingAll,
  onRefresh,
  onRefreshComplete,
  onScreenNew,
  onScreenAll,
  onScreeningDialogClose,
}: ResponseTableToolbarProps) {
  // Refresh state
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [refreshMessage, setRefreshMessage] = useState<string>("");
  const [refreshSubscriptionActive, setRefreshSubscriptionActive] =
    useState(false);

  // Screen new state
  const [screenNewDialogOpen, setScreenNewDialogOpen] = useState(false);
  const [screenNewError, setScreenNewError] = useState<string | null>(null);
  const [screenNewStatus, setScreenNewStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [screenNewMessage, setScreenNewMessage] = useState<string>("");
  const [screenNewProgress, setScreenNewProgress] =
    useState<ScreeningProgress | null>(null);
  const [screenNewSubscriptionActive, setScreenNewSubscriptionActive] =
    useState(false);

  // Screen all state
  const [screenAllDialogOpen, setScreenAllDialogOpen] = useState(false);
  const [screenAllError, setScreenAllError] = useState<string | null>(null);
  const [screenAllStatus, setScreenAllStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [screenAllMessage, setScreenAllMessage] = useState<string>("");
  const [screenAllProgress, setScreenAllProgress] =
    useState<ScreeningProgress | null>(null);
  const [screenAllSubscriptionActive, setScreenAllSubscriptionActive] =
    useState(false);

  // Timeout refs для предотвращения утечек памяти
  const screenNewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenAllTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh subscription
  useRefreshSubscription({
    vacancyId,
    enabled: refreshSubscriptionActive,
    fetchToken: fetchRefreshVacancyResponsesToken,
    onMessage: setRefreshMessage,
    onStatusChange: (status, message) => {
      if (status === "completed") {
        setRefreshStatus("success");
        onRefreshComplete();
      } else {
        setRefreshStatus("error");
        setRefreshError(message);
        onRefreshComplete();
      }
    },
  });

  // Screen new subscription
  useScreeningSubscription({
    vacancyId,
    enabled: screenNewSubscriptionActive,
    fetchToken: fetchScreenNewResponsesToken,
    onProgress: (message, progress) => {
      setScreenNewMessage(message);
      if (progress) setScreenNewProgress(progress);
    },
    onComplete: (success, progress) => {
      setScreenNewProgress(progress);
      if (success) {
        setScreenNewStatus("success");
        setScreenNewMessage(
          `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`,
        );
      } else {
        setScreenNewStatus("error");
        setScreenNewError("Процесс завершился с ошибками");
      }

      // Очищаем предыдущий таймер перед установкой нового
      if (screenNewTimerRef.current) {
        clearTimeout(screenNewTimerRef.current);
      }
      screenNewTimerRef.current = setTimeout(
        () => handleScreenNewDialogClose(),
        3000,
      );
    },
  });

  // Screen all subscription
  useScreeningSubscription({
    vacancyId,
    enabled: screenAllSubscriptionActive,
    fetchToken: fetchScreenAllResponsesToken,
    onProgress: (message, progress) => {
      setScreenAllMessage(message);
      if (progress) setScreenAllProgress(progress);
    },
    onComplete: (success, progress) => {
      setScreenAllProgress(progress);
      if (success) {
        setScreenAllStatus("success");
        setScreenAllMessage(
          `Оценка завершена! Обработано: ${progress.processed} из ${progress.total}`,
        );
      } else {
        setScreenAllStatus("error");
        setScreenAllError("Процесс завершился с ошибками");
      }

      // Очищаем предыдущий таймер перед установкой нового
      if (screenAllTimerRef.current) {
        clearTimeout(screenAllTimerRef.current);
      }
      screenAllTimerRef.current = setTimeout(
        () => handleScreenAllDialogClose(),
        3000,
      );
    },
  });

  // Handlers
  const handleRefreshClick = async () => {
    setRefreshError(null);
    setRefreshMessage("");
    setRefreshStatus("loading");
    setRefreshSubscriptionActive(true);

    try {
      await onRefresh();
    } catch (error) {
      setRefreshStatus("error");
      setRefreshError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleRefreshDialogClose = () => {
    if (refreshStatus !== "loading") {
      setRefreshDialogOpen(false);
      setRefreshError(null);
      setRefreshMessage("");
      setRefreshStatus("idle");
      setRefreshSubscriptionActive(false);
    }
  };

  const handleScreenNewClick = async () => {
    setScreenNewError(null);
    setScreenNewMessage("");
    setScreenNewProgress(null);
    setScreenNewStatus("loading");
    setScreenNewSubscriptionActive(true);

    try {
      await onScreenNew();
    } catch (error) {
      setScreenNewStatus("error");
      setScreenNewError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleScreenNewDialogClose = useCallback(() => {
    // Очищаем таймер при закрытии диалога
    if (screenNewTimerRef.current) {
      clearTimeout(screenNewTimerRef.current);
      screenNewTimerRef.current = null;
    }

    setScreenNewDialogOpen(false);
    setScreenNewError(null);
    setScreenNewMessage("");
    setScreenNewProgress(null);
    setScreenNewStatus("idle");
    setScreenNewSubscriptionActive(false);
    onScreeningDialogClose();
  }, [onScreeningDialogClose]);

  const handleScreenAllClick = async () => {
    setScreenAllError(null);
    setScreenAllMessage("");
    setScreenAllProgress(null);
    setScreenAllStatus("loading");
    setScreenAllSubscriptionActive(true);

    try {
      await onScreenAll();
    } catch (error) {
      setScreenAllStatus("error");
      setScreenAllError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleScreenAllDialogClose = useCallback(() => {
    // Очищаем таймер при закрытии диалога
    if (screenAllTimerRef.current) {
      clearTimeout(screenAllTimerRef.current);
      screenAllTimerRef.current = null;
    }

    setScreenAllDialogOpen(false);
    setScreenAllError(null);
    setScreenAllMessage("");
    setScreenAllProgress(null);
    setScreenAllStatus("idle");
    setScreenAllSubscriptionActive(false);
    onScreeningDialogClose();
  }, [onScreeningDialogClose]);

  // Очистка таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      if (screenNewTimerRef.current) {
        clearTimeout(screenNewTimerRef.current);
      }
      if (screenAllTimerRef.current) {
        clearTimeout(screenAllTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 md:px-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по ФИО..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full md:w-64 min-h-[44px] md:min-h-0 text-base md:text-sm"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <ResponseFilters
              selectedFilter={screeningFilter}
              onFilterChange={onFilterChange}
            />
            <ResponseStatusFilter
              selectedStatuses={statusFilter}
              onStatusChange={onStatusFilterChange}
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          <Button
            disabled={isRefreshing}
            variant="outline"
            onClick={() => setRefreshDialogOpen(true)}
            className="min-h-[44px] md:min-h-0 whitespace-nowrap shrink-0"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">
              {isRefreshing ? "Обновление..." : "Получить новые отклики"}
            </span>
            <span className="sm:hidden">
              {isRefreshing ? "Обновление..." : "Получить"}
            </span>
          </Button>

          <Button
            disabled={isProcessingNew}
            variant="outline"
            onClick={() => setScreenNewDialogOpen(true)}
            className="min-h-[44px] md:min-h-0 whitespace-nowrap shrink-0"
          >
            {isProcessingNew ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isProcessingNew ? "Оценка..." : "Оценить новые"}
          </Button>

          <Button
            disabled={isProcessingAll}
            variant="default"
            onClick={() => setScreenAllDialogOpen(true)}
            className="min-h-[44px] md:min-h-0 whitespace-nowrap shrink-0"
          >
            {isProcessingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">
              {isProcessingAll
                ? "Оценка..."
                : `Оценить всех (${totalResponses})`}
            </span>
            <span className="sm:hidden">
              {isProcessingAll ? "Оценка..." : "Оценить всех"}
            </span>
          </Button>
        </div>
      </div>

      <RefreshDialog
        open={refreshDialogOpen}
        status={refreshStatus}
        message={refreshMessage}
        error={refreshError}
        onOpenChange={setRefreshDialogOpen}
        onConfirm={handleRefreshClick}
        onClose={handleRefreshDialogClose}
      />

      <ScreeningDialog
        open={screenNewDialogOpen}
        title="Оценка новых откликов"
        description="Будет запущен процесс оценки новых откликов (без скрининга). Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически."
        status={screenNewStatus}
        message={screenNewMessage}
        error={screenNewError}
        progress={screenNewProgress}
        onOpenChange={(open) => {
          if (!open && screenNewStatus !== "loading") {
            handleScreenNewDialogClose();
          }
        }}
        onConfirm={handleScreenNewClick}
        onClose={handleScreenNewDialogClose}
      />

      <ScreeningDialog
        open={screenAllDialogOpen}
        title="Оценка всех откликов"
        description={`Вы собираетесь запустить оценку для ${totalResponses} ${getPluralForm(
          totalResponses,
          "отклика",
          "отклика",
          "откликов",
        )}. Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически.`}
        status={screenAllStatus}
        message={screenAllMessage}
        error={screenAllError}
        progress={screenAllProgress}
        onOpenChange={(open) => {
          if (!open && screenAllStatus !== "loading") {
            handleScreenAllDialogClose();
          }
        }}
        onConfirm={handleScreenAllClick}
        onClose={handleScreenAllDialogClose}
      />
    </>
  );
}
