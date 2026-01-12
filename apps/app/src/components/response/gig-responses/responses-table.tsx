"use client";

import { Card, CardContent, Table, TableBody, TableHead, TableHeader, TableRow } from "@qbs-autonaim/ui";
import type { Response } from "./use-response-filters";
import { ResponseRow } from "./response-row";

interface ResponsesTableProps {
  responses: Response[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept: (responseId: string) => void;
  onReject: (responseId: string) => void;
  onMessage: (responseId: string) => void;
  isProcessing: boolean;
}

export function ResponsesTable({
  responses,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
  isProcessing,
}: ResponsesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-50">Кандидат</TableHead>
                <TableHead className="min-w-30">Статус</TableHead>
                <TableHead className="min-w-35">HR статус</TableHead>
                <TableHead className="min-w-30">Дата</TableHead>
                <TableHead className="w-45 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <ResponseRow
                  key={response.id}
                  response={response}
                  orgSlug={orgSlug}
                  workspaceSlug={workspaceSlug}
                  gigId={gigId}
                  onAccept={onAccept}
                  onReject={onReject}
                  onMessage={onMessage}
                  isProcessing={isProcessing}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
