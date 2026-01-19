"use client";

import { paths } from "@qbs-autonaim/config";
import { Button, Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { ResponseDetailCard } from "~/components/response-detail";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancyResponseDetailPageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
    id: string; // vacancyId
    responseId: string;
  }>;
}

export default function VacancyResponseDetailPage({
  params,
}: VacancyResponseDetailPageProps) {
  const { orgSlug, slug: workspaceSlug, id: vacancyId, responseId } = use(params);
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: response, isLoading } = useQuery({
    ...trpc.vacancy.responses.get.queryOptions({
      id: responseId,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

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

  // Type assertion to include globalCandidate
  type ResponseWithGlobalCandidate = NonNullable<typeof response> & {
    globalCandidate: null;
  };

  const responseWithGlobalCandidate: ResponseWithGlobalCandidate = {
    ...response,
    globalCandidate: null, // TODO: load actual candidate if needed
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link
                href={paths.workspace.vacancies(
                  orgSlug,
                  workspaceSlug,
                  vacancyId,
                  "responses",
                )}
              >
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад к вакансии
                </Button>
              </Link>
              {response.interviewSession ? (
                <Link
                  href={paths.workspace.chat(orgSlug, workspaceSlug, response.id)}
                >
                  <Button variant="default" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Открыть чат
                  </Button>
                </Link>
              ) : null}
            </div>

            <ResponseDetailCard response={responseWithGlobalCandidate} />
          </div>
        </div>
      </div>
    </div>
  );
}
