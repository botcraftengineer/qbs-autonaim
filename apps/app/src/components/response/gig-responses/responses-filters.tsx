"use client";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbs-autonaim/ui";
import { Filter, Search } from "lucide-react";

interface ResponsesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ResponsesFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ResponsesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Поиск по имени кандидата…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 sm:h-10 text-base sm:text-sm border-muted-foreground/20 focus:border-primary transition-colors"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 touch-action-manipulation border-muted-foreground/20 focus:border-primary transition-colors">
          <Filter className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          <SelectItem value="NEW">Новые</SelectItem>
          <SelectItem value="EVALUATED">Оценены</SelectItem>
          <SelectItem value="INTERVIEW">Интервью</SelectItem>
          <SelectItem value="NEGOTIATION">Переговоры</SelectItem>
          <SelectItem value="COMPLETED">Завершены</SelectItem>
          <SelectItem value="SKIPPED">Пропущены</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
