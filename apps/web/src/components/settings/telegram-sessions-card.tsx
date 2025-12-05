"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@selectio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { TelegramAuthDialog } from "./telegram-auth";

export function TelegramSessionsCard({ workspaceId }: { workspaceId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sessions, isLoading } = useQuery(
    trpc.telegram.getSessions.queryOptions({ workspaceId }),
  );

  const deleteMutation = useMutation(
    trpc.telegram.deleteSession.mutationOptions({
      onSuccess: () => {
        toast.success("Сессия удалена");
        queryClient.invalidateQueries({
          queryKey: trpc.telegram.getSessions.queryKey({ workspaceId }),
        });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось удалить сессию");
      },
    }),
  );

  const handleDelete = (sessionId: string) => {
    if (confirm("Вы уверены, что хотите удалить эту сессию?")) {
      deleteMutation.mutate({ sessionId, workspaceId });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle className="text-base sm:text-lg font-medium">
            Telegram аккаунты
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить аккаунт
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Загрузка...</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {session.userInfo?.firstName}{" "}
                        {session.userInfo?.lastName}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {session.phone}
                        {session.userInfo?.username &&
                          ` • @${session.userInfo.username}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.isActive ? (
                          <span className="text-green-600">Активна</span>
                        ) : (
                          <span className="text-red-600">Неактивна</span>
                        )}
                        {session.lastUsedAt && (
                          <>
                            <span className="hidden sm:inline">
                              {" "}
                              • Последнее использование:{" "}
                              {new Date(
                                session.lastUsedAt,
                              ).toLocaleDateString()}
                            </span>
                            <span className="block sm:hidden">
                              {new Date(
                                session.lastUsedAt,
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                    disabled={deleteMutation.isPending}
                    className="self-end sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="ml-2 sm:hidden">Удалить</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-muted-foreground text-center py-8">
              Нет подключенных аккаунтов. Добавьте первый аккаунт для работы с
              Telegram.
            </div>
          )}
        </CardContent>
      </Card>

      <TelegramAuthDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        workspaceId={workspaceId}
      />
    </>
  );
}
