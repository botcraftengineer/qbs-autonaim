"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import {
  UpdateVacancyButton,
  VacancyAnalytics,
  VacancyHeader,
  VacancyRequirements,
  VacancyStats,
} from "~/components/vacancy";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancyDetailPageProps {
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default function VacancyDetailPage({ params }: VacancyDetailPageProps) {
  const { orgSlug, slug: workspaceSlug, id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: vacancy } = useQuery({
    ...trpc.vacancy.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const { data: analytics } = useQuery({
    ...trpc.vacancy.analytics.queryOptions({
      vacancyId: id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(id) && Boolean(workspaceId),
  });

  if (!vacancy) {
    return null;
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <VacancyAnalytics
          totalResponses={analytics.totalResponses}
          processedResponses={analytics.processedResponses}
          highScoreResponses={analytics.highScoreResponses}
          topScoreResponses={analytics.topScoreResponses}
          avgScore={analytics.avgScore}
        />
      )}

      <div className="rounded-lg border bg-linear-to-t from-primary/5 to-card dark:bg-card p-6 shadow-xs space-y-6">
        <VacancyHeader
          vacancyId={vacancy.id}
          workspaceId={workspaceId ?? ""}
          title={vacancy.title}
          region={vacancy.region}
          url={vacancy.url}
          isActive={vacancy.isActive}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          source={vacancy.source}
        />

        <VacancyStats
          views={vacancy.views}
          responses={vacancy.responses}
          newResponses={vacancy.newResponses}
          resumesInProgress={vacancy.resumesInProgress}
        />

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Описание вакансии</h2>
            <UpdateVacancyButton vacancyId={vacancy.id} />
          </div>
          {vacancy.description && (
            <div
              className="prose prose-sm max-w-none dark:prose-invert text-sm leading-snug text-muted-foreground [&_p]:mb-2 [&_p]:leading-snug"
              dangerouslySetInnerHTML={{
                __html: vacancy.description,
              }}
            />
          )}
        </div>
      </div>
      {vacancy.requirements ? (
        <VacancyRequirements requirements={vacancy.requirements as unknown} />
      ) : null}
    </div>
  );
}
