import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@selectio/ui";
import Link from "next/link";
import { SiteHeader } from "~/components/layout";
import { api } from "~/trpc/server";

export default async function VacanciesPage() {
  const caller = await api();
  const vacancies = await caller.vacancy.list();

  return (
    <>
      <SiteHeader title="Вакансии" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {vacancies.length === 0 ? (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">
                      Нет вакансий
                    </h2>
                    <p className="text-muted-foreground">
                      Запустите парсер для загрузки вакансий
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Регион</TableHead>
                        <TableHead className="text-right">Просмотры</TableHead>
                        <TableHead className="text-right">Отклики</TableHead>
                        <TableHead className="text-right">Новые</TableHead>
                        <TableHead className="text-right">В работе</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vacancies.map((vacancy) => (
                        <TableRow key={vacancy.id}>
                          <TableCell>
                            <Link
                              href={`/vacancies/${vacancy.id}`}
                              className="font-medium hover:underline"
                            >
                              {vacancy.title}
                            </Link>
                          </TableCell>
                          <TableCell>{vacancy.region || "—"}</TableCell>
                          <TableCell className="text-right">
                            {vacancy.views}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/vacancies/${vacancy.id}?tab=responses`}
                              className="font-medium hover:underline text-primary"
                            >
                              {vacancy.responses}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            {vacancy.newResponses ? (
                              <Badge variant="default">
                                {vacancy.newResponses}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {vacancy.resumesInProgress || "—"}
                          </TableCell>
                          <TableCell>
                            {vacancy.isActive ? (
                              <Badge variant="default">Активна</Badge>
                            ) : (
                              <Badge variant="secondary">Неактивна</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
