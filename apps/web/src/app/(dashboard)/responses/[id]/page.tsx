"use client";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@selectio/ui";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendar,
  IconLanguage,
  IconSchool,
  IconUser,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { SiteHeader } from "~/components/layout";
import { ResponseActions } from "~/components/response";
import { useTRPC } from "~/trpc/react";

interface ResponseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ResponseDetailPage({
  params,
}: ResponseDetailPageProps) {
  const { id } = use(params);
  const trpc = useTRPC();
  const { data: response, isLoading } = useQuery(
    trpc.vacancy.responses.getById.queryOptions({ id })
  );

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Загрузка..." />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Skeleton className="h-6 w-40 mb-6" />
                <div className="space-y-6">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-32" />
                  <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!response) {
    return (
      <>
        <SiteHeader title="Не найдено" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">Отклик не найден</p>
        </div>
      </>
    );
  }

  const isNew =
    new Date(response.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <>
      <SiteHeader title="Детали отклика" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Навигация назад */}
              <Link
                href="/responses"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <IconArrowLeft className="h-4 w-4" />
                Назад к откликам
              </Link>

              {/* Заголовок */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">
                        {response.candidateName || "Без имени"}
                      </h1>
                      {isNew && (
                        <Badge variant="default" className="text-sm">
                          Новый
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4" />
                        {new Date(response.createdAt).toLocaleDateString(
                          "ru-RU",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Действия */}
                <ResponseActions
                  responseId={response.id}
                  resumeUrl={response.resumeUrl}
                  candidateName={response.candidateName}
                  hasGreeting={!!response.screening?.greeting}
                />
              </div>

              {/* Вакансия */}
              {response.vacancy && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconBriefcase className="h-5 w-5" />
                      Вакансия
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/vacancies/${response.vacancyId}`}
                      className="text-lg font-medium hover:underline"
                    >
                      {response.vacancy.title}
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* О себе */}
                {response.about ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUser className="h-5 w-5" />О себе
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">
                        {response.about}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Языки */}
                {response.languages ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconLanguage className="h-5 w-5" />
                        Языки
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">
                        {response.languages}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Опыт работы */}
              {response.experience ? (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconBriefcase className="h-5 w-5" />
                      Опыт работы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {response.experience}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Образование */}
              {response.education ? (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconSchool className="h-5 w-5" />
                      Образование
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {response.education}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Курсы */}
              {response.courses ? (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconSchool className="h-5 w-5" />
                      Курсы и сертификаты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {response.courses}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Результаты скрининга */}
              {response.screening && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Результаты скрининга</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Оценка
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          response.screening.score >= 4
                            ? "text-green-600"
                            : response.screening.score >= 3
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {response.screening.score}/5
                      </p>
                    </div>

                    {response.screening.greeting && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Приветственное предложение
                        </p>
                        <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                          <p className="text-sm leading-relaxed">
                            {response.screening.greeting}
                          </p>
                        </div>
                      </div>
                    )}

                    {response.screening.analysis && (
                      <div>
                        <p className="text-sm font-medium mb-2">Анализ</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {response.screening.analysis}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Контакты */}
              {response.contacts ? (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Контакты</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(response.contacts, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
