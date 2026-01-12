"use client";

import { Badge, Button, TableCell, TableRow } from "@qbs-autonaim/ui";
import { Check, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import type { Response } from "./use-response-filters";
import { formatDate, getHrStatusLabel, getStatusLabel, getStatusVariant } from "./response-helpers";

interface ResponseRowProps {
  response: Response;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept: (responseId: string) => void;
  onReject: (responseId: string) => void;
  onMessage: (responseId: string) => void;
  isProcessing: boolean;
}

export function ResponseRow({
  response,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
}: ResponseRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${response.id}`}
          className="font-medium hover:underline"
        >
          {response.candidateName || "Без имени"}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(response.status)}>
          {getStatusLabel(response.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {response.hrSelectionStatus ? (
          <Badge variant="outline">
            {getHrStatusLabel(response.hrSelectionStatus)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDate(response.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMessage(response.id)}
            className="h-8 w-8 p-0 touch-action-manipulation"
            title="Отправить сообщение"
            aria-label={`Отправить сообщение кандидату ${response.candidateName || "без имени"}`}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAccept(response.id)}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 touch-action-manipulation"
            title="Принять"
            aria-label={`Принять кандидата ${response.candidateName || "без имени"}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReject(response.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 touch-action-manipulation"
            title="Отклонить"
            aria-label={`Отклонить кандидата ${response.candidateName || "без имени"}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
