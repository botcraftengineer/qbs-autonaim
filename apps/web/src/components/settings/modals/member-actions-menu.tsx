"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@selectio/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
}

export function useMemberActionsMenu({
  member,
  workspaceId,
}: {
  member: Member;
  workspaceId: string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return {
    setShowMemberActionsMenu: setShowMenu,
    MemberActionsMenu: () => (
      <RemoveMemberDialog
        open={showMenu}
        onOpenChange={setShowMenu}
        member={member}
        workspaceId={workspaceId}
      />
    ),
  };
}

function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  workspaceId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const removeUser = useMutation(
    trpc.workspace.removeUser.mutationOptions({
      onSuccess: () => {
        toast.success(`${member.name} удален из workspace`);
        onOpenChange(false);
        queryClient.invalidateQueries(trpc.workspace.members.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось удалить участника");
      },
    }),
  );

  const handleRemove = () => {
    removeUser.mutate({
      workspaceId,
      userId: member.id,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить участника?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить{" "}
            <span className="font-medium">{member.name}</span> из workspace? Это
            действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeUser.isPending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={removeUser.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {removeUser.isPending ? "Удаление..." : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
