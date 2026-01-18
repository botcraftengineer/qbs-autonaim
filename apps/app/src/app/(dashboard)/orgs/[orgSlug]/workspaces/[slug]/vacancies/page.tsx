"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Badge,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import {
  IconCalendar,
  IconFilter,
  IconRefresh,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { triggerUpdateVacancies } from "~/actions/trigger";
import { PageHeader } from "~/components/layout";
import { VacancyStats } from "~/components/vacancies";
import { useWorkspace } from "~/hooks/use-workspace";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";
import { useTRPC } from "~/trpc/react";

export default function VacanciesPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const api = useTRPC();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [mergeOpenVacancyId, setMergeOpenVacancyId] = useState<string | null>(
    null,
  );
  const [mergeTargetVacancyId, setMergeTargetVacancyId] = useState<string>("");

  const mergeVacanciesMutation = useMutation(
    api.freelancePlatforms.mergeVacancies.mutationOptions({
      onSuccess: async () => {
        toast.success("Вакансии сдружены");
        setMergeOpenVacancyId(null);
        setMergeTargetVacancyId("");
        await queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancies.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось сдружить вакансии");
      },
    }),
  );

  const { data: vacancies, isLoading } = useQuery({
    ...api.freelancePlatforms.getVacancies.queryOptions({
      workspaceId: workspace?.id ?? "",
      ...(sourceFilter !== "all" && {
        source: sourceFilter.toUpperCase() as
          | "HH"
          | "KWORK"
          | "FL_RU"
          | "FREELANCE_RU"
          | "AVITO"
          | "SUPERJOB"
          | "HABR",
      }),
    }),
    enabled: !!workspace?.id,
  });

  const filteredAndSortedVacancies = useMemo(() => {
    if (!vacancies) return [];

    let filtered = [...vacancies];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.region?.toLowerCase().includes(query),
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((v) => v.source === sourceFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((v) => v.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((v) => !v.isActive);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((v) => new Date(v.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v) => new Date(v.createdAt) <= toDate);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "responses":
          return (b.totalResponsesCount ?? 0) - (a.totalResponsesCount ?? 0);
        case "newResponses":
          return (b.newResponses ?? 0) - (a.newResponses ?? 0);
        case "views":
          return (b.views ?? 0) - (a.views ?? 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return filtered;
  }, [
    vacancies,
    searchQuery,
    sourceFilter,
    statusFilter,
    sortBy,
    dateFrom,
    dateTo,
  ]);

  const stats = useMemo(() => {
    if (!vacancies) {
      return {
        totalVacancies: 0,
        activeVacancies: 0,
        totalResponses: 0,
        newResponses: 0,
      };
    }

    return {
      totalVacancies: vacancies.length,
      activeVacancies: vacancies.filter((v) => v.isActive).length,
      totalResponses: vacancies.reduce(
        (sum, v) => sum + (v.totalResponsesCount ?? 0),
        0,
      ),
      newResponses: vacancies.reduce(
        (sum, v) => sum + (v.newResponses ?? 0),
        0,
      ),
    };
  }, [vacancies]);

  const handleUpdate = async () => {
    if (!workspace?.id) {
      toast.error("Workspace не найден");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await triggerUpdateVacancies(workspace.id);
      if (result.success) {
        toast.success("Обновление вакансий запущено");
      } else {
        toast.error("Ошибка при запуске обновления");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Вакансии"
        description="Управление вакансиями и их настройками"
        docsUrl="https://docs.hh.qbs.ru/vacancies"
      >
        <div className="flex gap-2">
          <Button asChild variant="default">
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/create`}
              aria-label="Создать вакансию для фриланс-платформы"
            >
              <IconSparkles className="size-4" aria-hidden="true" />
              Создать вакансию
            </Link>
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            variant="outline"
            aria-label="Синхронизировать активные вакансии из источников"
          >
            <IconRefresh
              className={`size-4 ${isUpdating ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {isUpdating ? "Синхронизация…" : "Синхронизировать"}
          </Button>
        </div>
      </PageHeader>

      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
          <VacancyStats
            totalVacancies={stats.totalVacancies}
            activeVacancies={stats.activeVacancies}
            totalResponses={stats.totalResponses}
            newResponses={stats.newResponses}
            isLoading={isLoading}
          />

          <div className="space-y-4">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1 md:max-w-sm">
                  <IconSearch
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Поиск по названию или региону…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    aria-label="Поиск вакансий"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger
                      className="w-full sm:w-[160px]"
                      aria-label="Фильтр по источнику"
                    >
                      <IconFilter className="size-4" aria-hidden="true" />
                      <SelectValue placeholder="Источник" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все источники</SelectItem>
                      <SelectItem value="HH">HeadHunter</SelectItem>
                      <SelectItem value="KWORK">Kwork</SelectItem>
                      <SelectItem value="FL_RU">FL.ru</SelectItem>
                      <SelectItem value="FREELANCE_RU">Freelance.ru</SelectItem>
                      <SelectItem value="AVITO">Avito</SelectItem>
                      <SelectItem value="SUPERJOB">SuperJob</SelectItem>
                      <SelectItem value="HABR">Хабр Карьера</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      className="w-full sm:w-[140px]"
                      aria-label="Фильтр по статусу"
                    >
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="inactive">Неактивные</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-[180px] justify-start"
                        aria-label="Фильтр по дате"
                      >
                        <IconCalendar className="size-4" aria-hidden="true" />
                        {dateFrom || dateTo ? (
                          <span className="truncate">
                            {dateFrom &&
                              new Date(dateFrom).toLocaleDateString("ru-RU")}
                            {dateFrom && dateTo && " - "}
                            {dateTo &&
                              new Date(dateTo).toLocaleDateString("ru-RU")}
                          </span>
                        ) : (
                          "Диапазон дат"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="date-from"
                            className="text-sm font-medium"
                          >
                            С даты
                          </label>
                          <Input
                            id="date-from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            max={dateTo || undefined}
                            aria-label="Дата начала"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="date-to"
                            className="text-sm font-medium"
                          >
                            По дату
                          </label>
                          <Input
                            id="date-to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            min={dateFrom || undefined}
                            aria-label="Дата окончания"
                          />
                        </div>
                        {(dateFrom || dateTo) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDateFrom("");
                              setDateTo("");
                            }}
                            aria-label="Сбросить фильтр по дате"
                          >
                            Сбросить
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger
                      className="w-full sm:w-[160px]"
                      aria-label="Сортировка"
                    >
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">По дате</SelectItem>
                      <SelectItem value="responses">По откликам</SelectItem>
                      <SelectItem value="newResponses">По новым</SelectItem>
                      <SelectItem value="views">По просмотрам</SelectItem>
                      <SelectItem value="title">По названию</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {!isLoading && filteredAndSortedVacancies.length > 0 && (
              <div className="mb-3 text-sm text-muted-foreground">
                Найдено вакансий:{" "}
                <span className="font-medium tabular-nums">
                  {filteredAndSortedVacancies.length}
                </span>
                {(searchQuery ||
                  sourceFilter !== "all" ||
                  statusFilter !== "all" ||
                  dateFrom ||
                  dateTo) &&
                  vacancies &&
                  filteredAndSortedVacancies.length !== vacancies.length && (
                    <span> из {vacancies.length}</span>
                  )}
              </div>
            )}

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Регион
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell">
                      Просмотры
                    </TableHead>
                    <TableHead className="text-right">Отклики</TableHead>
                    <TableHead className="text-right">Новые</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      В работе
                    </TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }, (_, i) => i).map((id) => (
                      <TableRow key={`skeleton-${id}`}>
                        <TableCell>
                          <Skeleton className="h-5 w-[200px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-[100px]" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-[80px]" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-5 w-[40px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[40px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-[40px] ml-auto" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-[40px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-[80px]" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-9 w-[110px] ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredAndSortedVacancies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-[400px]">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <h2 className="text-2xl font-semibold mb-2">
                              {searchQuery ||
                              sourceFilter !== "all" ||
                              statusFilter !== "all" ||
                              dateFrom ||
                              dateTo
                                ? "Ничего не найдено"
                                : "Нет вакансий"}
                            </h2>
                            <p className="text-muted-foreground">
                              {searchQuery ||
                              sourceFilter !== "all" ||
                              statusFilter !== "all" ||
                              dateFrom ||
                              dateTo
                                ? "Попробуйте изменить параметры поиска"
                                : "Запустите парсер для загрузки вакансий"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedVacancies.map((vacancy) => (
                      <TableRow key={vacancy.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={paths.workspace.vacancies(
                              orgSlug ?? "",
                              workspaceSlug ?? "",
                              vacancy.id,
                            )}
                            className="font-medium hover:underline"
                          >
                            {vacancy.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {vacancy.source === "HH"
                              ? "HeadHunter"
                              : vacancy.source === "KWORK"
                                ? "Kwork"
                                : vacancy.source === "FL_RU"
                                  ? "FL.ru"
                                  : vacancy.source === "FREELANCE_RU"
                                    ? "Freelance.ru"
                                    : vacancy.source === "AVITO"
                                      ? "Avito"
                                      : vacancy.source === "SUPERJOB"
                                        ? "SuperJob"
                                        : vacancy.source === "HABR"
                                          ? "Хабр Карьера"
                                          : vacancy.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {vacancy.region || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden lg:table-cell">
                          {vacancy.views ?? 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Link
                            href={paths.workspace.vacancies(
                              orgSlug ?? "",
                              workspaceSlug ?? "",
                              vacancy.id,
                            )}
                            className="font-medium hover:underline text-primary"
                          >
                            {vacancy.totalResponsesCount ?? 0}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          {vacancy.newResponses && vacancy.newResponses > 0 ? (
                            <Badge
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {vacancy.newResponses}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden md:table-cell">
                          {vacancy.resumesInProgress ?? "—"}
                        </TableCell>
                        <TableCell>
                          {vacancy.isActive ? (
                            <Badge variant="default">Активна</Badge>
                          ) : (
                            <Badge variant="secondary">Неактивна</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover
                            open={mergeOpenVacancyId === vacancy.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setMergeOpenVacancyId(vacancy.id);
                                setMergeTargetVacancyId("");
                              } else {
                                setMergeOpenVacancyId(null);
                                setMergeTargetVacancyId("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!workspace?.id}
                              >
                                Сдружить
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[320px]">
                              <div className="space-y-3">
                                <div className="text-sm font-medium">
                                  Основная вакансия
                                </div>
                                <Select
                                  value={mergeTargetVacancyId}
                                  onValueChange={setMergeTargetVacancyId}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите вакансию" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(vacancies ?? [])
                                      .filter((v) => v.id !== vacancy.id)
                                      .map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                          {v.title}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setMergeOpenVacancyId(null);
                                      setMergeTargetVacancyId("");
                                    }}
                                  >
                                    Отмена
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={
                                      !workspace?.id ||
                                      !mergeTargetVacancyId ||
                                      mergeVacanciesMutation.isPending
                                    }
                                    onClick={() => {
                                      if (!workspace?.id) return;
                                      if (!mergeTargetVacancyId) return;
                                      mergeVacanciesMutation.mutate({
                                        workspaceId: workspace.id,
                                        sourceVacancyId: vacancy.id,
                                        targetVacancyId: mergeTargetVacancyId,
                                      });
                                    }}
                                  >
                                    Подтвердить
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
