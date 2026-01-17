"use client";

import { Badge, Button, Card, Separator } from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconMessage,
  IconRobot,
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
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Загрузка…</div>
        </Card>
      </div>
    );
  }

  if (!data?.vacancy) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">
            Вакансия не найдена
          </div>
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
      {/* Основная информация */}
      <Card>
        <div className="p-6 space-y-6">
          {/* Заголовок */}
          <div>
            <h2 className="text-lg font-semibold mb-1">{vacancy.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline">{getPlatformName(vacancy.source)}</Badge>
              {vacancy.isActive ? (
                <Badge variant="default">Активна</Badge>
              ) : (
                <Badge variant="secondary">Неактивна</Badge>
              )}
              {vacancy.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2"
                  asChild
                >
                  <Link
                    href={vacancy.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Открыть вакансию на платформе"
                  >
                    <IconExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="text-xs">На платформе</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Описание */}
          {vacancy.description && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Описание</h3>
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
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Требования</h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {String(vacancy.requirements)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* AI-интервью */}
          {isFreelancePlatform && interviewLink && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconRobot
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-medium">AI-интервью</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Добавьте эту ссылку в описание вакансии на фриланс-платформе
                </p>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 rounded-lg bg-muted px-3 py-2.5 font-mono text-xs break-all min-h-[44px] flex items-center">
                      {interviewLink.url}
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      size="sm"
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
                    <h4 className="text-sm font-medium">Шаблон для описания</h4>
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
      </Card>

      {/* Статистика откликов */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Статистика откликов</h2>
            <p className="text-sm text-muted-foreground">
              Анализ по источникам
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <div
                className="text-2xl font-bold text-foreground mb-1"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {responseStats.HH_API ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">
                HeadHunter API
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div
                className="text-2xl font-bold text-foreground mb-1"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {responseStats.FREELANCE_MANUAL ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Импорт вручную
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div
                className="text-2xl font-bold text-foreground mb-1"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {responseStats.FREELANCE_LINK ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">По ссылке</div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-center">
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6 text-center">
              <div
                className="text-3xl font-bold text-primary mb-1"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {(responseStats.HH_API ?? 0) +
                  (responseStats.FREELANCE_MANUAL ?? 0) +
                  (responseStats.FREELANCE_LINK ?? 0)}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Всего откликов
              </div>
            </div>
          </div>

          {isFreelancePlatform && (
            <>
              <Separator />
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
            </>
          )}
        </div>
      </Card>

      {/* Шортлист кандидатов */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Шортлист кандидатов</h2>
            <p className="text-sm text-muted-foreground">
              Лучшие кандидаты по AI-анализу
            </p>
          </div>

          {shortlistLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Загрузка кандидатов…
              </div>
            </div>
          ) : !shortlist || shortlist.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <IconUsers
                className="size-8 text-muted-foreground mx-auto mb-3"
                aria-hidden="true"
              />
              <h3 className="font-medium text-sm mb-1">Шортлист пока пуст</h3>
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
                    className="flex items-center justify-between rounded-lg border bg-card p-4 gap-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-sm">
                          {candidate.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          AI-оценка:{" "}
                          <span
                            className="font-semibold text-primary"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {candidate.overallScore}
                          </span>
                          <span>/100</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="shrink-0 min-h-[44px] gap-2"
                    >
                      <Link
                        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                        aria-label={`Посмотреть профиль ${candidate.name}`}
                      >
                        <IconMessage className="size-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Подробнее</span>
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {shortlist.length > 5 && (
                <>
                  <Separator />
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
