"use client";

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { IconSearch } from "@tabler/icons-react";
import { VacancyTableRow } from "./vacancy-table-row";

interface Vacancy {
  id: string;
  title: string;
  source: string;
  region: string | null;
  views: number | null;
  totalResponsesCount: number | null;
  newResponses: number | null;
  resumesInProgress: number | null;
  isActive: boolean | null;
}

interface VacancyTableProps {
  vacancies: Vacancy[];
  isLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string | undefined;
  allVacancies: Vacancy[];
  mergeOpenVacancyId: string | null;
  mergeTargetVacancyId: string;
  onMergeOpen: (vacancyId: string) => void;
  onMergeClose: () => void;
  onMergeTargetChange: (vacancyId: string) => void;
  onMergeConfirm: (sourceId: string, targetId: string) => void;
  isMerging: boolean;
  hasFilters: boolean;
}

export function VacancyTable({
  vacancies,
  isLoading,
  orgSlug,
  workspaceSlug,
  workspaceId,
  allVacancies,
  mergeOpenVacancyId,
  mergeTargetVacancyId,
  onMergeOpen,
  onMergeClose,
  onMergeTargetChange,
  onMergeConfirm,
  isMerging,
  hasFilters,
}: VacancyTableProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px] font-semibold text-foreground">
              Название
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Источник
            </TableHead>
            <TableHead className="hidden font-semibold text-foreground md:table-cell">
              Регион
            </TableHead>
            <TableHead className="hidden text-right font-semibold text-foreground lg:table-cell">
              Просмотры
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              Отклики
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              Новые
            </TableHead>
            <TableHead className="hidden text-right font-semibold text-foreground md:table-cell">
              В&nbsp;работе
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Статус
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              Действия
            </TableHead>
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
                  <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : vacancies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-[400px]">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted/50 p-4">
                    <IconSearch className="size-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">
                    {hasFilters ? "Ничего не найдено" : "Нет вакансий"}
                  </h3>
                  <p className="max-w-[300px] text-sm text-muted-foreground">
                    {hasFilters
                      ? "Попробуйте изменить параметры поиска или сбросить фильтры"
                      : "Запустите обновление, чтобы загрузить вакансии из подключенных источников"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            vacancies.map((vacancy) => (
              <VacancyTableRow
                key={vacancy.id}
                vacancy={vacancy}
                orgSlug={orgSlug}
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                allVacancies={allVacancies}
                mergeOpenVacancyId={mergeOpenVacancyId}
                mergeTargetVacancyId={mergeTargetVacancyId}
                onMergeOpen={onMergeOpen}
                onMergeClose={onMergeClose}
                onMergeTargetChange={onMergeTargetChange}
                onMergeConfirm={onMergeConfirm}
                isMerging={isMerging}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
