"use client";

import {
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
} from "@qbs-autonaim/ui";
import { IconCalendar, IconFilter, IconSearch } from "@tabler/icons-react";

interface VacancyFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export function VacancyFilters({
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: VacancyFiltersProps) {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Поиск вакансий"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={sourceFilter} onValueChange={onSourceChange}>
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

          <Select value={statusFilter} onValueChange={onStatusChange}>
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
                    {dateFrom && new Date(dateFrom).toLocaleDateString("ru-RU")}
                    {dateFrom && dateTo && " - "}
                    {dateTo && new Date(dateTo).toLocaleDateString("ru-RU")}
                  </span>
                ) : (
                  "Диапазон дат"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <label htmlFor="date-from" className="text-sm font-medium">
                    С&nbsp;даты
                  </label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    max={dateTo || undefined}
                    aria-label="Дата начала"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="date-to" className="text-sm font-medium">
                    По&nbsp;дату
                  </label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    min={dateFrom || undefined}
                    aria-label="Дата окончания"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDateFromChange("");
                      onDateToChange("");
                    }}
                    aria-label="Сбросить фильтр по дате"
                  >
                    Сбросить
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={onSortChange}>
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
  );
}
