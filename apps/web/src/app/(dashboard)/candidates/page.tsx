import Link from "next/link";
import { SiteHeader } from "~/components/layout";
import { Card, Badge, Button } from "@selectio/ui";
import { MessageCircle, User } from "lucide-react";
import { api } from "~/trpc/server";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const statusConfig = {
  NEW: { label: "Новый", variant: "secondary" as const },
  EVALUATED: { label: "Оценен", variant: "default" as const },
  DIALOG_APPROVED: { label: "Диалог одобрен", variant: "default" as const },
  INTERVIEW_HH: { label: "Интервью HH", variant: "default" as const },
  INTERVIEW_WHATSAPP: {
    label: "Интервью WhatsApp",
    variant: "default" as const,
  },
  COMPLETED: { label: "Завершен", variant: "outline" as const },
  SKIPPED: { label: "Пропущен", variant: "outline" as const },
};

export default async function CandidatesPage() {
  // Получаем все отклики
  const responses = await (api as any).vacancy.responses.listAll();

  return (
    <>
      <SiteHeader title="Кандидаты" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {responses.length > 0 ? (
                <div className="grid gap-4">
                  {responses.map(
                    (response: {
                      id: string;
                      status: keyof typeof statusConfig;
                      candidateName: string | null;
                      telegramUsername: string | null;
                      createdAt: Date;
                      about: string | null;
                    }) => {
                      const status = statusConfig[response.status];
                      const initials = response.candidateName
                        ? response.candidateName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "??";

                      return (
                        <Card key={response.id} className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="h-12 w-12 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold shrink-0">
                                {initials}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">
                                    {response.candidateName ?? "Без имени"}
                                  </h3>
                                  <Badge variant={status.variant}>
                                    {status.label}
                                  </Badge>
                                </div>

                                <div className="space-y-1">
                                  {response.telegramUsername && (
                                    <p className="text-sm text-muted-foreground">
                                      @{response.telegramUsername}
                                    </p>
                                  )}

                                  <p className="text-xs text-muted-foreground">
                                    Отклик от{" "}
                                    {format(
                                      response.createdAt,
                                      "dd MMMM yyyy, HH:mm",
                                      {
                                        locale: ru,
                                      }
                                    )}
                                  </p>

                                  {response.about && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                      {response.about}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Link href={`/candidates/${response.id}/chat`}>
                              <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Открыть чат
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold mb-2">
                      Нет кандидатов
                    </h2>
                    <p className="text-muted-foreground">
                      Пока нет откликов от кандидатов
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
