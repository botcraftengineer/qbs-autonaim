"use client";

import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui";

interface ResponseHeaderProps {
  gigTitle: string;
  totalResponses: number;
}

export function ResponseHeader({ gigTitle, totalResponses }: ResponseHeaderProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl wrap-break-word">
              Отклики на задание
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs sm:text-sm wrap-break-word">
              {gigTitle}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="text-sm sm:text-base px-2 py-0.5 sm:px-3 sm:py-1 shrink-0"
          >
            {totalResponses}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
