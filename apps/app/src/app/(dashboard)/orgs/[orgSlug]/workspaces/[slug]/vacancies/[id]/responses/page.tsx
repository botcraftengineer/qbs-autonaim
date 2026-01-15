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
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
              <IconMessage className="size-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Отклики на вакансию
              </h1>
              <p className="text-muted-foreground">
                Управление и анализ откликов кандидатов
              </p>
            </div>
          </div>
          <Separator className="mb-4" />
        </div>

        <ResponseTable vacancyId={id} workspaceSlug={workspaceSlug} />
      </Card>
    </div>
  );
}
