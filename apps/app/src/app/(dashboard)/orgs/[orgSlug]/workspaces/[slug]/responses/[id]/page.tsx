"use client";

import { paths } from "@qbs-autonaim/config";
import { Button, Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import {
  ExperienceTab,
  InterviewScoringCard,
  ResponseHeaderCard,
  ScreeningResultsCard,
} from "~/components/response-detail";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface ResponseDetailPageProps {
  params: Promise<{ orgSlug: string; slug: string; id: string }>;
}

export default function ResponseDetailPage({
  params,
}: ResponseDetailPageProps) {
  const { orgSlug, slug: workspaceSlug, id } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: response, isLoading } = useQuery({
    ...trpc.vacancy.responses.get.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  // Type assertion to include globalCandidate
  type ResponseWithGlobalCandidate = typeof response & {
    globalCandidate: null;
  };

  const responseWithGlobalCandidate: ResponseWithGlobalCandidate | null =
    response
      ? {
          ...response,
          globalCandidate: null, // TODO: load actual candidate if needed
        }
      : null;

  if (!workspaceId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Рабочее пространство не найдено</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Skeleton className="h-10 w-40 mb-4" />
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Отклик не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link href={paths.workspace.root(orgSlug, workspaceSlug)}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад
                </Button>
              </Link>
              {response.interviewSession && (
                <Link href={paths.workspace.chat(orgSlug, workspaceSlug, id)}>
                  <Button variant="default" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Открыть чат
                  </Button>
                </Link>
              )}
            </div>

            <div className="space-y-6 md:space-y-8">
              {responseWithGlobalCandidate && (
                <>
                  <ResponseHeaderCard response={responseWithGlobalCandidate} />
                  {responseWithGlobalCandidate.screening && (
                    <ScreeningResultsCard
                      screening={responseWithGlobalCandidate.screening}
                    />
                  )}
                  {responseWithGlobalCandidate.interviewScoring && (
                    <InterviewScoringCard
                      interviewScoring={
                        responseWithGlobalCandidate.interviewScoring
                      }
                    />
                  )}
                  {responseWithGlobalCandidate.experience && (
                    <ExperienceTab response={responseWithGlobalCandidate} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
