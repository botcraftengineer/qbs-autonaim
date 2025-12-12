"use client";

import {
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useTRPC } from "~/trpc/react";

interface VacancyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; id: string }>;
}

export default function VacancyLayout({
  children,
  params,
}: VacancyLayoutProps) {
  const { workspaceSlug, id } = use(params);
  const pathname = usePathname();
  const trpc = useTRPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: vacancy, isLoading: vacancyLoading } = useQuery({
    ...trpc.vacancy.getById.queryOptions({
      id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const { data: responsesCount, isLoading: responsesLoading } = useQuery({
    ...trpc.vacancy.responses.getCount.queryOptions({
      vacancyId: id,
      workspaceId: workspaceId ?? "",
    }),
    enabled: Boolean(workspaceId),
  });

  const isLoading = vacancyLoading || responsesLoading;

  // Определяем активный таб на основе pathname
  const getActiveTab = () => {
    if (pathname.endsWith("/settings")) return "settings";
    if (pathname.endsWith("/detail")) return "overview";
    return "responses";
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Загрузка…" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Skeleton className="h-10 md:h-10 w-32 md:w-40 mb-4" />
                <div className="space-y-4 md:space-y-6">
                  <Skeleton className="h-10 md:h-10 w-full md:w-64" />
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!vacancyLoading && !vacancy) {
    return (
      <>
        <SiteHeader title="Не найдено" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">Вакансия не найдена</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title={vacancy?.title ?? "Вакансия"} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-4">
                <Link href={`/${workspaceSlug}/vacancies`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] md:min-h-0"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Назад к списку</span>
                    <span className="sm:hidden">Назад</span>
                  </Button>
                </Link>
              </div>

              <Tabs value={getActiveTab()} className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger
                      value="responses"
                      asChild
                      className="flex-1 sm:flex-initial min-h-[44px] md:min-h-0"
                    >
                      <Link href={`/${workspaceSlug}/vacancies/${id}`}>
                        <span className="hidden sm:inline">
                          Отклики ({responsesCount?.total ?? 0})
                        </span>
                        <span className="sm:hidden">Отклики</span>
                      </Link>
                    </TabsTrigger>
                    <TabsTrigger
                      value="overview"
                      asChild
                      className="flex-1 sm:flex-initial min-h-[44px] md:min-h-0"
                    >
                      <Link href={`/${workspaceSlug}/vacancies/${id}/detail`}>
                        Обзор
                      </Link>
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      asChild
                      className="flex-1 sm:flex-initial min-h-[44px] md:min-h-0"
                    >
                      <Link href={`/${workspaceSlug}/vacancies/${id}/settings`}>
                        Настройки
                      </Link>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {children}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
