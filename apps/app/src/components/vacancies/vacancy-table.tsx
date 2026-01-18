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
  isActive: boolean;
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Источник</TableHead>
            <TableHead className="hidden md:table-cell">Регион</TableHead>
            <TableHead className="text-right hidden lg:table-cell">
              Просмотры
            </TableHead>
            <TableHead className="text-right">Отклики</TableHead>
            <TableHead className="text-right">Новые</TableHead>
            <TableHead className="text-right hidden md:table-cell">
              В&nbsp;работе
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
          ) : vacancies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-[400px]">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">
                      {hasFilters ? "Ничего не найдено" : "Нет вакансий"}
                    </h2>
                    <p className="text-muted-foreground">
                      {hasFilters
                        ? "Попробуйте изменить параметры поиска"
                        : "Запустите парсер для загрузки вакансий"}
                    </p>
                  </div>
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
