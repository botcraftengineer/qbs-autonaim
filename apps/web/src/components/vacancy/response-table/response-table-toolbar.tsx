import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@selectio/ui";
import { FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { ResponseFilters, type ScreeningFilter } from "~/components/response";
import { ScreeningProgressDialog } from "../screening-progress-dialog";

interface ResponseTableToolbarProps {
  vacancyId: string;
  totalResponses: number;
  filteredCount: number;
  screeningFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
  isRefreshing: boolean;
  isProcessingNew: boolean;
  isProcessingAll: boolean;
  isParsingResumes: boolean;
  onRefresh: () => void;
  onScreenNew: () => void;
  onScreenAll: () => void;
  onParseResumes: () => void;
  onScreeningDialogClose: () => void;
}

export function ResponseTableToolbar({
  vacancyId,
  totalResponses,
  filteredCount,
  screeningFilter,
  onFilterChange,
  isRefreshing,
  isProcessingNew,
  isProcessingAll,
  isParsingResumes,
  onRefresh,
  onScreenNew,
  onScreenAll,
  onParseResumes,
  onScreeningDialogClose,
}: ResponseTableToolbarProps) {
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [parseStatus, setParseStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [parseError, setParseError] = useState<string | null>(null);

  const handleRefreshClick = async () => {
    setRefreshStatus("loading");
    setRefreshError(null);

    try {
      await onRefresh();
      setRefreshStatus("success");

      setTimeout(() => {
        setRefreshDialogOpen(false);
        setRefreshStatus("idle");
      }, 2000);
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
      setRefreshStatus("idle");
      setRefreshError(null);
    }
  };

  const handleParseClick = async () => {
    setParseStatus("loading");
    setParseError(null);

    try {
      await onParseResumes();
      setParseStatus("success");

      setTimeout(() => {
        setParseDialogOpen(false);
        setParseStatus("idle");
      }, 2000);
    } catch (error) {
      setParseStatus("error");
      setParseError(
        error instanceof Error ? error.message : "Произошла ошибка",
      );
    }
  };

  const handleParseDialogClose = () => {
    if (parseStatus !== "loading") {
      setParseDialogOpen(false);
      setParseStatus("idle");
      setParseError(null);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Показано: {filteredCount} из {totalResponses}
        </div>
        <ResponseFilters
          selectedFilter={screeningFilter}
          onFilterChange={onFilterChange}
        />
      </div>
      <div className="flex gap-2">
        <Dialog open={refreshDialogOpen} onOpenChange={setRefreshDialogOpen}>
          <Button
            disabled={isRefreshing}
            variant="outline"
            onClick={() => setRefreshDialogOpen(true)}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? "Обновление..." : "Получить новые отклики"}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Получение новых откликов</DialogTitle>
              <DialogDescription>
                {refreshStatus === "idle" && (
                  <>
                    Будет запущен процесс получения новых откликов с HeadHunter
                    для этой вакансии. Процесс будет выполняться в фоновом
                    режиме, и новые отклики появятся в таблице автоматически.
                  </>
                )}
                {refreshStatus === "loading" && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Запускаем получение откликов...</span>
                  </div>
                )}
                {refreshStatus === "success" && (
                  <div className="text-green-600">
                    ✓ Процесс успешно запущен! Новые отклики появятся в таблице
                    автоматически.
                  </div>
                )}
                {refreshStatus === "error" && (
                  <div className="text-red-600">
                    ✗ Ошибка: {refreshError || "Не удалось запустить процесс"}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {refreshStatus === "idle" && (
                <>
                  <Button variant="outline" onClick={handleRefreshDialogClose}>
                    Отмена
                  </Button>
                  <Button onClick={handleRefreshClick}>Получить отклики</Button>
                </>
              )}
              {refreshStatus === "loading" && (
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Запуск...
                </Button>
              )}
              {(refreshStatus === "success" || refreshStatus === "error") && (
                <Button onClick={handleRefreshDialogClose}>Закрыть</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={parseDialogOpen} onOpenChange={setParseDialogOpen}>
          <Button
            disabled={isParsingResumes}
            variant="outline"
            onClick={() => setParseDialogOpen(true)}
          >
            {isParsingResumes ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {isParsingResumes ? "Парсинг..." : "Распарсить резюме"}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Парсинг резюме новых откликов</DialogTitle>
              <DialogDescription>
                {parseStatus === "idle" && (
                  <>
                    Будут распарсены резюме откликов, у которых ещё нет данных
                    резюме. Процесс будет выполняться в фоновом режиме.
                  </>
                )}
                {parseStatus === "loading" && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Запускаем парсинг резюме...</span>
                  </div>
                )}
                {parseStatus === "success" && (
                  <div className="text-green-600">
                    ✓ Процесс успешно запущен! Данные резюме появятся
                    автоматически.
                  </div>
                )}
                {parseStatus === "error" && (
                  <div className="text-red-600">
                    ✗ Ошибка: {parseError || "Не удалось запустить процесс"}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {parseStatus === "idle" && (
                <>
                  <Button variant="outline" onClick={handleParseDialogClose}>
                    Отмена
                  </Button>
                  <Button onClick={handleParseClick}>Запустить парсинг</Button>
                </>
              )}
              {parseStatus === "loading" && (
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Запуск...
                </Button>
              )}
              {(parseStatus === "success" || parseStatus === "error") && (
                <Button onClick={handleParseDialogClose}>Закрыть</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          disabled={isProcessingNew}
          variant="outline"
          onClick={onScreenNew}
        >
          {isProcessingNew ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isProcessingNew ? "Оценка..." : "Оценить новые"}
        </Button>

        <ScreeningProgressDialog
          vacancyId={vacancyId}
          isOpen={isProcessingNew}
          onClose={onScreeningDialogClose}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isProcessingAll} variant="default">
              {isProcessingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isProcessingAll
                ? "Запуск оценки..."
                : `Оценить всех (${totalResponses})`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Подтверждение массовой оценки</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь запустить оценку для {totalResponses}{" "}
                {totalResponses === 1
                  ? "отклика"
                  : totalResponses < 5
                    ? "откликов"
                    : "откликов"}
                . Это может занять некоторое время.
                <br />
                <br />
                Процесс будет выполняться в фоновом режиме. Вы можете продолжать
                работу, а результаты появятся автоматически.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={onScreenAll}>
                Запустить оценку
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
