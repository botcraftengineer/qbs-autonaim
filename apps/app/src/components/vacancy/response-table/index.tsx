"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@qbs-autonaim/ui";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { ResponseRow } from "../response-row";
import { BulkActionsBar } from "./bulk-actions-bar";
import { EmptyState } from "./empty-state";
import { ResponseTableHeader } from "./response-table-header";
import { ResponseTableToolbar } from "./response-table-toolbar";
import { useResponseActions } from "./use-response-actions";
import { useResponseTable } from "./use-response-table";

interface ResponseTableProps {
  vacancyId: string;
  workspaceSlug: string;
  accessToken?: string;
}

const ITEMS_PER_PAGE = 25;

type ResponsesListData = RouterOutputs["vacancy"]["responses"]["list"];
type Response = ResponsesListData["responses"][0];

export function ResponseTable({
  vacancyId,
  workspaceSlug,
  accessToken,
}: ResponseTableProps) {
  const trpc = useTRPC();
  const { workspace, orgSlug } = useWorkspace();
  const {
    currentPage,
    setCurrentPage,
    sortField,
    sortDirection,
    handleSort,
    selectedIds,
    setSelectedIds,
    screeningFilter,
    setScreeningFilter,
    statusFilter,
    apiStatusFilter,
    setStatusFilter,
    searchInput,
    debouncedSearch,
    handleSearchChange,
    handleSelectOne,
  } = useResponseTable();

  const { data, isLoading, isFetching } = useQuery({
    ...trpc.vacancy.responses.list.queryOptions({
      workspaceId: workspace?.id ?? "",
      vacancyId,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortField,
      sortDirection,
      screeningFilter,
      statusFilter: apiStatusFilter,
      search: debouncedSearch,
    }),
    enabled: !!workspace?.id,
    placeholderData: keepPreviousData,
  });

  const {
    isProcessing,
    isProcessingAll,
    isProcessingNew,
    isRefreshing,
    isSendingWelcome,
    handleBulkScreen,
    handleScreenAll,
    handleScreenNew,
    handleScreeningDialogClose,
    handleRefreshResponses,
    handleRefreshComplete,
    handleSendWelcomeBatch,
  } = useResponseActions(vacancyId, selectedIds, setSelectedIds);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    currentPage,
    sortField,
    sortDirection,
    screeningFilter,
    statusFilter,
    debouncedSearch,
  ]);

  const responses = (data as any)?.responses ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = (data as any)?.totalPages ?? 0;

  const allSelected =
    responses.length > 0 && responses.every((r: any) => selectedIds.has(r.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map((r) => r.id)));
    }
  };

  // Рендерим скелетон для строк таблицы при загрузке
  const renderTableContent = () => {
    if (isLoading || (isFetching && !isLoading)) {
      // Показываем скелетон во время загрузки
      const skeletonRows = [];
      for (let i = 0; i < 5; i++) {
        skeletonRows.push(
          <TableRow key={`skeleton-${vacancyId}-${currentPage}-${i}`}>
            <TableCell>
              <Skeleton className="h-5 w-5" />
            </TableCell>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-24" />
            </TableCell>
          </TableRow>,
        );
      }
      return skeletonRows;
    }

    if (responses.length === 0) {
      return <EmptyState hasResponses={total > 0} colSpan={9} />;
    }

    return responses.map((response: any) => (
      <ResponseRow
        key={response.id}
        orgSlug={orgSlug ?? ""}
        response={response}
        workspaceSlug={workspaceSlug}
        accessToken={accessToken}
        isSelected={selectedIds.has(response.id)}
        onSelect={handleSelectOne}
      />
    ));
  };

  return (
    <div className="space-y-4">
      <ResponseTableToolbar
        vacancyId={vacancyId}
        totalResponses={total}
        screeningFilter={screeningFilter}
        onFilterChange={setScreeningFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={searchInput}
        onSearchChange={handleSearchChange}
        isRefreshing={isRefreshing}
        isProcessingNew={isProcessingNew}
        isProcessingAll={isProcessingAll}
        onRefresh={handleRefreshResponses}
        onRefreshComplete={handleRefreshComplete}
        onScreenNew={handleScreenNew}
        onScreenAll={handleScreenAll}
        onScreeningDialogClose={handleScreeningDialogClose}
      />

      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-muted/50">
          <div className="text-sm font-medium">
            Всего откликов: <span className="text-foreground">{total}</span>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            isSendingWelcome={isSendingWelcome}
            isProcessing={isProcessing}
            onSendWelcome={handleSendWelcomeBatch}
            onBulkScreen={handleBulkScreen}
          />
        )}

        <Table>
          <ResponseTableHeader
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            hasResponses={responses.length > 0}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>{renderTableContent()}</TableBody>
        </Table>

        {total > 0 && (
          <div className="border-t px-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, total)} из {total}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
