"use client";

import { paths } from "@qbs-autonaim/config";
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import Link from "next/link";

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

interface VacancyTableRowProps {
  vacancy: Vacancy;
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
}

const SOURCE_LABELS: Record<string, string> = {
  HH: "HeadHunter",
  KWORK: "Kwork",
  FL_RU: "FL.ru",
  FREELANCE_RU: "Freelance.ru",
  AVITO: "Avito",
  SUPERJOB: "SuperJob",
  HABR: "Хабр Карьера",
};

export function VacancyTableRow({
  vacancy,
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
}: VacancyTableRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <Link
          href={paths.workspace.vacancies(orgSlug, workspaceSlug, vacancy.id)}
          className="font-medium hover:underline"
        >
          {vacancy.title}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {SOURCE_LABELS[vacancy.source] || vacancy.source}
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
          href={paths.workspace.vacancies(orgSlug, workspaceSlug, vacancy.id)}
          className="font-medium hover:underline text-primary"
        >
          {vacancy.totalResponsesCount ?? 0}
        </Link>
      </TableCell>
      <TableCell className="text-right">
        {vacancy.newResponses && vacancy.newResponses > 0 ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
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
              onMergeOpen(vacancy.id);
            } else {
              onMergeClose();
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!workspaceId}
              aria-label="Сдружить вакансии"
            >
              Сдружить…
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[320px]">
            <div className="space-y-3">
              <div className="text-sm font-medium">Основная вакансия</div>
              <Select
                value={mergeTargetVacancyId}
                onValueChange={onMergeTargetChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вакансию" />
                </SelectTrigger>
                <SelectContent>
                  {allVacancies
                    .filter((v) => v.id !== vacancy.id)
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onMergeClose}>
                  Отмена
                </Button>
                <Button
                  size="sm"
                  disabled={!workspaceId || !mergeTargetVacancyId || isMerging}
                  onClick={() => {
                    if (!workspaceId || !mergeTargetVacancyId) return;
                    onMergeConfirm(vacancy.id, mergeTargetVacancyId);
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
  );
}
