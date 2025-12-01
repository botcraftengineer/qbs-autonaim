"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@selectio/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

export function useInviteMemberModal(workspaceId: string) {
  const [showModal, setShowModal] = useState(false);

  return {
    setShowInviteMemberModal: setShowModal,
    InviteMemberModal: () => (
      <InviteMemberModalContent
        open={showModal}
        onOpenChange={setShowModal}
        workspaceId={workspaceId}
      />
    ),
  };
}

function InviteMemberModalContent({
  open,
  onOpenChange,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "member">("member");

  const addUser = useMutation(
    trpc.workspace.addUser.mutationOptions({
      onSuccess: () => {
        toast.success("Участник добавлен");
        setUserId("");
        setRole("member");
        onOpenChange(false);
        queryClient.invalidateQueries(trpc.workspace.members.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось добавить участника");
      },
    }),
  );

  const handleInvite = () => {
    if (!userId.trim()) {
      toast.error("Введите ID пользователя");
      return;
    }

    addUser.mutate({
      workspaceId,
      userId: userId.trim(),
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Пригласить участника</DialogTitle>
          <DialogDescription>
            Добавьте нового участника в workspace
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="userId">ID пользователя</Label>
            <Input
              id="userId"
              type="text"
              placeholder="user_id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Введите ID существующего пользователя
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Роль</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "owner" | "admin" | "member")}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addUser.isPending}
          >
            Отмена
          </Button>
          <Button onClick={handleInvite} disabled={addUser.isPending}>
            {addUser.isPending ? "Добавление..." : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
