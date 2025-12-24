"use client";

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  Clock,
  Mail,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { InviteMemberDialog } from "./invite-member-dialog";

interface OrganizationInvitationsClientProps {
  organizationId: string;
}

export function OrganizationInvitationsClient({
  organizationId,
}: OrganizationInvitationsClientProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Получение списка приглашений
  const { data: invites, isLoading } = useQuery(
    trpc.organization.listInvites.queryOptions({
      organizationId,
    }),
  );

  // Удаление приглашения
  const deleteInviteMutation = useMutation(
    trpc.organization.deleteInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Приглашение отменено");
        queryClient.invalidateQueries(trpc.organization.pathFilter());
      },
      onError: (error) => {
        toast.error("Ошибка при отмене приглашения", {
          description: error.message,
        });
      },
    }),
  );

  const handleDeleteInvite = (inviteId: string) => {
    setSelectedInviteId(inviteId);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedInviteId) {
      deleteInviteMutation.mutate({
        organizationId,
        inviteId: selectedInviteId,
      });
      setIsDialogOpen(false);
      setSelectedInviteId(null);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "owner":
        return "Владелец";
      case "admin":
        return "Администратор";
      case "member":
        return "Участник";
      default:
        return role;
    }
  };

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Приглашения</CardTitle>
          <CardDescription>Загрузка приглашений…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Приглашения</h2>
          <p className="text-muted-foreground">
            Управляйте активными приглашениями в организацию
          </p>
        </div>
        <InviteMemberDialog organizationId={organizationId} />
      </div>

      {invites && invites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Mail className="size-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Нет активных приглашений
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Пригласите новых участников в организацию, чтобы они появились
              здесь
            </p>
            <InviteMemberDialog
              organizationId={organizationId}
              trigger={
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Пригласить участника
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invites?.map((invite) => {
            const expired = isExpired(invite.expiresAt);

            return (
              <Card key={invite.id} className={expired ? "opacity-60" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                          <Mail className="size-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {invite.invitedEmail || "Без email"}
                            </p>
                            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                              {getRoleName(invite.role)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              Создано{" "}
                              {formatDistanceToNow(new Date(invite.createdAt), {
                                addSuffix: true,
                                locale: ru,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-muted-foreground" />
                        {expired ? (
                          <span className="text-destructive">
                            Срок действия истёк{" "}
                            {formatDistanceToNow(new Date(invite.expiresAt), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Действительно до{" "}
                            {new Date(invite.expiresAt).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>

                      {expired && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Это приглашение больше не действительно. Создайте
                            новое приглашение для этого пользователя.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteInvite(invite.id)}
                      disabled={deleteInviteMutation.isPending}
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Отменить приглашение</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить приглашение</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отменить это приглашение? Ссылка станет
              недействительной, и пользователь не сможет присоединиться к
              организации по этому приглашению.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteInviteMutation.isPending}
            >
              {deleteInviteMutation.isPending
                ? "Отмена…"
                : "Отменить приглашение"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
