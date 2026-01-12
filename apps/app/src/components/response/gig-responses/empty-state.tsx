"use client";

import { Card, CardContent } from "@qbs-autonaim/ui";
import { MessageSquare } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:pt-6 sm:px-6 sm:pb-6">
        <div className="text-center py-8 sm:py-12">
          <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            Нет откликов
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {hasFilters
              ? "Попробуйте изменить фильтры поиска"
              : "Пока что никто не откликнулся на это задание"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
