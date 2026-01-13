"use client";

import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Separator,
} from "@qbs-autonaim/ui";
import {
  IconChartBar,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFileText,
  IconMessage,
  IconRobot,
  IconStar,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

export default function VacancyDetailPage() {
  const {
    id,
    orgSlug,
    slug: workspaceSlug,
  } = useParams<{
    id: string;
    orgSlug: string;
    slug: string;
  }>();
  const { workspace } = useWorkspace();
  const api = useTRPC();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data, isLoading } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const { data: shortlistData, isLoading: shortlistLoading } = useQuery({
    ...api.freelancePlatforms.getShortlist.queryOptions({
      vacancyId: id,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!id,
  });

  const shortlist = shortlistData?.candidates ?? [];

  const handleCopyLink = async () => {
    if (!data?.interviewLink?.url) return;

    try {
      await navigator.clipboard.writeText(data.interviewLink.url);
      setCopiedLink(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleCopyTemplate = async () => {
    if (!data?.vacancy || !data?.interviewLink?.url) return;

    const template = `${data.vacancy.description || data.vacancy.title}

Для отклика пройдите короткое AI-интервью (10–15 минут):
${data.interviewLink.url}

После прохождения интервью мы свяжемся с вами при положительном решении.`;

    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(true);
      toast.success("Шаблон скопирован");
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch {
      toast.error("Не удалось скопировать шаблон");
    }
  };

  const getPlatformName = (source: string) => {
    const platforms: Record<string, string> = {
      kwork: "Kwork",
      fl: "FL.ru",
      freelance: "Freelance.ru",
      hh: "HeadHunter",
      avito: "Avito",
      superjob: "SuperJob",
      habr: "Хабр Карьера",
    };
    return platforms[source] || source;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data?.vacancy) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Вакансия не найдена</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { vacancy, responseStats, interviewLink } = data;
  const isFreelancePlatform = ["kwork", "fl", "freelance"].includes(
    vacancy.source,
  );

  return (
    <div className="space-y-6">
      {/* Основная информация о вакансии */}
      <Card className="p-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
              <IconFileText
                className="size-6 text-primary"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {vacancy.title}
              </h1>
              <p className="text-muted-foreground">Информация о вакансии</p>
            </div>
          </div>
          <Separator className="mb-4" />
        </div>

        <div className="space-y-8">
          {/* Статус и платформа */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-linear-to-b from-primary to-primary/60 rounded-full"></div>
              <h3 className="text-lg font-semibold text-foreground">
                Статус вакансии
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="h-6">
                {getPlatformName(vacancy.source)}
              </Badge>
              {vacancy.isActive ? (
                <Badge variant="default" className="h-6">
                  Активна
                </Badge>
              ) : (
                <Badge variant="secondary" className="h-6">
                  Неактивна
                </Badge>
              )}
              {vacancy.url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1"
                  asChild
                >
                  <Link
                    href={vacancy.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Открыть вакансию на платформе"
                  >
                    <IconExternalLink className="size-3" aria-hidden="true" />
                    <span className="text-xs">На платформе</span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Описание вакансии */}
            {vacancy.description && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-linear-to-b from-primary to-primary/60 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Описание вакансии
                    </h3>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {vacancy.description}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Требования */}
            {vacancy.requirements && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-linear-to-b from-primary to-primary/60 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Требования
                    </h3>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {String(vacancy.requirements)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Ссылка на интервью (только для фриланс-платформ) */}
            {isFreelancePlatform && interviewLink && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-linear-to-b from-primary to-primary/60 rounded-full"></div>
                    <IconRobot
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-semibold text-foreground">
                      AI-интервью
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Добавьте эту ссылку в описание вакансии на фриланс-платформе
                  </p>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 rounded-lg bg-muted px-4 py-3 font-mono text-sm break-all min-h-[44px] flex items-center">
                        {interviewLink.url}
                      </div>
                      <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        className="min-h-[44px] shrink-0 gap-2"
                        aria-label="Скопировать ссылку на интервью"
                      >
                        {copiedLink ? (
                          <>
                            <IconCheck className="size-4" aria-hidden="true" />
                            Скопировано
                          </>
                        ) : (
                          <>
                            <IconCopy className="size-4" aria-hidden="true" />
                            Копировать
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Шаблон для описания
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Используйте этот текст при размещении вакансии
                      </p>
                      <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                        {vacancy.description || vacancy.title}
                        {"\n\n"}
                        Для отклика пройдите короткое AI-интервью (10–15 минут):
                        {"\n"}
                        {interviewLink.url}
                        {"\n\n"}
                        После прохождения интервью мы свяжемся с вами при
                        положительном решении.
                      </div>
                      <Button
                        onClick={handleCopyTemplate}
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] gap-2"
                        aria-label="Скопировать шаблон описания"
                      >
                        {copiedTemplate ? (
                          <>
                            <IconCheck className="size-4" aria-hidden="true" />
                            Скопировано
                          </>
                        ) : (
                          <>
                            <IconCopy className="size-4" aria-hidden="true" />
                            Копировать шаблон
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Статистика и аналитика */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Статистика откликов */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
                <IconChartBar
                  className="size-6 text-primary"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Статистика откликов
                </h2>
                <p className="text-muted-foreground">Анализ по источникам</p>
              </div>
            </div>
            <Separator className="mb-4" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-linear-to-br from-primary/5 to-primary/10 border border-primary/10 p-4 text-center transition-colors hover:from-primary/10 hover:to-primary/15">
                <div
                  className="text-3xl font-bold tabular-nums text-primary mb-2"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {responseStats.HH_API ?? 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  HeadHunter API
                </div>
              </div>
              <div className="rounded-xl bg-linear-to-br from-primary/5 to-primary/10 border border-primary/10 p-4 text-center transition-colors hover:from-primary/10 hover:to-primary/15">
                <div
                  className="text-3xl font-bold tabular-nums text-primary mb-2"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {responseStats.FREELANCE_MANUAL ?? 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Импорт вручную
                </div>
              </div>
              <div className="rounded-xl bg-linear-to-br from-primary/5 to-primary/10 border border-primary/10 p-4 text-center transition-colors hover:from-primary/10 hover:to-primary/15">
                <div
                  className="text-3xl font-bold tabular-nums text-primary mb-2"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {responseStats.FREELANCE_LINK ?? 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  По ссылке
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-center">
              <div className="rounded-xl bg-linear-to-br from-primary/10 to-primary/20 border border-primary/20 p-6 text-center w-full max-w-xs">
                <div className="text-4xl font-bold tabular-nums text-primary mb-2">
                  {(responseStats.HH_API ?? 0) +
                    (responseStats.FREELANCE_MANUAL ?? 0) +
                    (responseStats.FREELANCE_LINK ?? 0)}
                </div>
                <div className="text-base font-medium text-muted-foreground">
                  Всего откликов
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Действия */}
        {isFreelancePlatform && (
          <Card className="p-6">
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
                  <IconUpload
                    className="size-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Управление откликами
                  </h2>
                  <p className="text-muted-foreground">Импорт и обработка</p>
                </div>
              </div>
              <Separator className="mb-4" />
            </div>

            <div className="space-y-4">
              <Button
                asChild
                variant="default"
                className="w-full min-h-[44px] gap-2"
              >
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/import`}
                >
                  <IconUpload className="size-4" aria-hidden="true" />
                  Импортировать отклики
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Шортлист кандидатов */}
      <Card className="p-6">
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
              <IconStar className="size-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Шортлист кандидатов
              </h2>
              <p className="text-muted-foreground">
                Лучшие кандидаты по AI-анализу
              </p>
            </div>
          </div>
          <Separator className="mb-4" />
        </div>

        <div className="space-y-4">
          {shortlistLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Загрузка кандидатов…
              </div>
            </div>
          ) : !shortlist || shortlist.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <IconUsers
                className="size-8 text-muted-foreground mx-auto mb-3"
                aria-hidden="true"
              />
              <h3 className="font-medium text-muted-foreground mb-2">
                Шортлист пока пуст
              </h3>
              <p className="text-sm text-muted-foreground">
                Импортируйте отклики и проведите интервью для формирования
                шортлиста
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {shortlist.slice(0, 5).map((candidate, index) => (
                  <div
                    key={candidate.responseId}
                    className="flex items-center justify-between rounded-xl bg-linear-to-r from-muted/20 to-muted/30 border border-muted/40 p-5 gap-4 transition-all duration-200 hover:from-muted/30 hover:to-muted/40 hover:border-muted/60 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/30 border-2 border-primary/30 text-primary font-bold text-sm shrink-0 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-foreground">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          AI-оценка:{" "}
                          <span className="font-bold text-primary tabular-nums text-base">
                            {candidate.overallScore}
                          </span>
                          <span className="text-xs">/100</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="shrink-0 min-h-[44px] gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Link
                        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                        aria-label={`Посмотреть профиль ${candidate.name}`}
                      >
                        <IconMessage className="size-4" aria-hidden="true" />
                        Подробнее
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {shortlist.length > 5 && (
                <>
                  <Separator className="my-4" />
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] gap-2"
                    asChild
                  >
                    <Link
                      href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}/shortlist`}
                    >
                      <IconUsers className="size-4" aria-hidden="true" />
                      Показать всех ({shortlist.length})
                    </Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
