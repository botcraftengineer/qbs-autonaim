"use client";

import { Card, Separator } from "@qbs-autonaim/ui";
import { IconMessage } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { ResponseTable } from "~/components/vacancy";

export default function VacancyResponsesPage() {
  const { slug: workspaceSlug, id } = useParams<{
    slug: string;
    id: string;
  }>();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Отклики
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление и интеллектуальный анализ кандидатов для вашей вакансии
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live обновления</span>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="p-1 sm:p-6 relative">
          <ResponseTable vacancyId={id} workspaceSlug={workspaceSlug} />
        </div>
      </Card>
    </div>
  );
}
