"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { IconDots, IconSearch } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getAvatarUrl, getInitials } from "~/lib/avatar";
import { useTRPC } from "~/trpc/react";

type MemberRole = "owner" | "admin" | "member";

interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: MemberRole;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

function MembersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-full max-w-sm ml-auto" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader, order never changes
              <TableRow key={`skeleton-row-${i}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-10 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Stats Skeleton */}
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

export function OrganizationMembersClient({
  organizationId,
  currentUserId,
}: {
  organizationId: string;
  currentUserId: string;
}) {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all");

  // Получение участников
  const { data: members, isLoading } = useQuery(
    trpc.organization.listMembers.queryOptions({ organizationId }),
  );

  // Определение роли текущего пользователя
  const currentUserRole = useMemo(() => {
    return members?.find((m) => m.userId === currentUserId)?.role;
  }, [members, currentUserId]);

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin";
  const canManageMembers = isOwner || isAdmin;

  // Фильтрация участников
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    return members.filter((member) => {
      const matchesSearch =
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  if (isLoading) {
    return <MembersLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Участники</h2>
          <p className="text-sm text-muted-foreground">
            Управляйте участниками организации
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as MemberRole | "all")}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="owner">Владелец</SelectItem>
            <SelectItem value="admin">Администратор</SelectItem>
            <SelectItem value="member">Участник</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 sm:max-w-sm sm:ml-auto">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Имя</TableHead>
              <TableHead className="min-w-[120px]">Роль</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Участники не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member: OrganizationMember) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  organizationId={organizationId}
                  currentUserId={currentUserId}
                  canManageMembers={canManageMembers}
                  isOwner={isOwner}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Показано {filteredMembers.length} из {members?.length ?? 0} участников
      </div>
    </div>
  );
}

function MemberRow({
  member,
  organizationId,
  currentUserId,
  canManageMembers,
  isOwner,
}: {
  member: OrganizationMember;
  organizationId: string;
  currentUserId: string;
  canManageMembers: boolean;
  isOwner: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isCurrentUser = member.userId === currentUserId;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const initials = getInitials(member.user.name);
  const avatarUrl = getAvatarUrl(member.user.image, member.user.name);

  const updateRole = useMutation(
    trpc.organization.updateMemberRole.mutationOptions({
      onSuccess: () => {
        toast.success("Роль обновлена");
        queryClient.invalidateQueries(trpc.organization.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось обновить роль");
      },
    }),
  );

  const removeMemberMutation = useMutation(
    trpc.organization.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Участник удалён");
        queryClient.invalidateQueries(trpc.organization.pathFilter());
        setShowDeleteDialog(false);
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось удалить участника");
      },
    }),
  );

  const handleRoleChange = (newRole: MemberRole) => {
    updateRole.mutate({
      organizationId,
      userId: member.userId,
      role: newRole,
    });
  };

  const handleDelete = () => {
    removeMemberMutation.mutate({
      organizationId,
      userId: member.userId,
    });
  };

  // owner может менять роли всех, кроме себя
  // admin не может менять роли owner'ов
  const canChangeRole =
    !isCurrentUser &&
    (isOwner || (canManageMembers && member.role !== "owner"));

  const canDelete = canManageMembers && !isCurrentUser;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={avatarUrl} alt={member.user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">
                {member.user.name}
                {isCurrentUser && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (вы)
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {member.user.email}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Select
            value={member.role}
            onValueChange={handleRoleChange}
            disabled={!canChangeRole || updateRole.isPending}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Владелец</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
              <SelectItem value="member">Участник</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowDeleteDialog(true)}
              aria-label="Действия с участником"
            >
              <IconDots className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowDeleteDialog(false);
            }
          }}
        >
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 id="delete-dialog-title" className="text-lg font-semibold mb-2">
              Удалить участника?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Вы уверены, что хотите удалить {member.user.name} из организации?
              Это действие нельзя отменить.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={removeMemberMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending ? "Удаление…" : "Удалить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
