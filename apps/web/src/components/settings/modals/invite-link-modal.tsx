"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@selectio/ui";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

export function useInviteLinkModal() {
  const [showModal, setShowModal] = useState(false);

  return {
    setShowInviteLinkModal: setShowModal,
    InviteLinkModal: () => (
      <InviteLinkModalContent open={showModal} onOpenChange={setShowModal} />
    ),
  };
}

function InviteLinkModalContent({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  // TODO: Получить реальную ссылку приглашения из API
  const inviteLink = "https://selection-web.vercel.app/invite/abc123xyz";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ссылка для приглашения</DialogTitle>
          <DialogDescription>
            Поделитесь этой ссылкой с людьми, которых хотите пригласить в
            workspace
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="flex-1" />
            <Button onClick={handleCopy} variant="outline" className="gap-2">
              {copied ? (
                <>
                  <IconCheck className="h-4 w-4" />
                  Скопировано
                </>
              ) : (
                <>
                  <IconCopy className="h-4 w-4" />
                  Копировать
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Эта ссылка действительна в течение 7 дней. Любой, у кого есть эта
            ссылка, сможет присоединиться к workspace.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
