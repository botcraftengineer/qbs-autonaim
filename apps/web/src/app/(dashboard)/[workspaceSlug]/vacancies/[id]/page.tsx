"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { use } from "react";
import { ResponseTable } from "~/components/vacancy";

interface VacancyResponsesPageProps {
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default function VacancyResponsesPage({
  params,
}: VacancyResponsesPageProps) {
  const { workspaceSlug, id } = use(params);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-4 py-4 md:px-6 md:py-6">
          <CardTitle className="text-lg md:text-xl">
            Отклики на вакансию
          </CardTitle>
          <CardDescription className="text-sm">
            Управление откликами
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <ResponseTable vacancyId={id} workspaceSlug={workspaceSlug} />
        </CardContent>
      </Card>
    </div>
  );
}
