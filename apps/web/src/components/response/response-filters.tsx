"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@selectio/ui";
import { IconFilter } from "@tabler/icons-react";

export type ScreeningFilter =
  | "all"
  | "evaluated"
  | "not-evaluated"
  | "high-score"
  | "low-score";

interface ResponseFiltersProps {
  selectedFilter: ScreeningFilter;
  onFilterChange: (filter: ScreeningFilter) => void;
}

export function ResponseFilters({
  selectedFilter,
  onFilterChange,
}: ResponseFiltersProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconFilter className="h-4 w-4 mr-2" />
          Фильтр по скринингу
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Скрининг</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={selectedFilter === "all"}
          onCheckedChange={() => onFilterChange("all")}
        >
          Все отклики
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selectedFilter === "evaluated"}
          onCheckedChange={() => onFilterChange("evaluated")}
        >
          Оценены
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selectedFilter === "not-evaluated"}
          onCheckedChange={() => onFilterChange("not-evaluated")}
        >
          Не оценены
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={selectedFilter === "high-score"}
          onCheckedChange={() => onFilterChange("high-score")}
        >
          Высокая оценка (≥4)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selectedFilter === "low-score"}
          onCheckedChange={() => onFilterChange("low-score")}
        >
          Низкая оценка (&lt;4)
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
