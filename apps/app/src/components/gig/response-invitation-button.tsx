"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconMessagePlus,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface ResponseInvitationButtonProps {
  responseId: string;
  candidateName?: string | null;
}

export function ResponseInvitationButton({
  responseId,
  candidateName,
}: ResponseInvitationButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const { data: invitation, isLoading: isLoadingInvitation } = useQuery({
    ...trpc.gig.responses.getInvitation.queryOptions({
      responseId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && open,
  });

  const { mutate: generateInvitation, isPending: isGenerating } = useMutation({
    ...trpc.gig.responses.generateInvitation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.getInvitation.queryKey({
            responseId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Приглашение сгенерировано");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  });

  const handleGenerate = useCallback(() => {
    if (!workspace?.id) return;
    generateInvitation({ responseId, workspaceId: workspace.id });
  }, [generateInvitation, responseId, workspace?.id]);

  const handleCopy = useCallback(async () => {
    if (!invitation?.invitationText) return;
    try {
      await navigator.clipboard.writeText(invitation.invitationText);
      setCopied(true);
      toast.success("Приглашение скопировано");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [invitation?.invitationText]);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-h-[32px]"
        aria-label={`Сгенерировать приглашение для ${candidateName || "кандидата"}`}
      >
        <IconMessagePlus className="size-4 mr-2" aria-hidden="true" />
        Приглашение
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Приглашение на интервью</DialogTitle>
            <DialogDescription>
              {candidateName
                ? `Приглашение для ${candidateName}`
                : "Сгенерируйте текст приглашения для отправки кандидату"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingInvitation ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2
                  className="size-6 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only">Загрузка…</span>
              </div>
            ) : invitation ? (
              <>
                <Textarea
                  value={invitation.invitationText}
                  readOnly
                  rows={10}
                  className="resize-none font-mono text-sm"
                  aria-label="Текст приглашения"
                />

                <div className="text-xs text-muted-foreground">
                  Ссылка на интервью: {invitation.interviewUrl}
                </div>

                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full min-h-[44px]"
                  aria-label="Скопировать приглашение"
                >
                  {copied ? (
                    <>
                      <IconCheck className="size-4 mr-2" aria-hidden="true" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <IconCopy className="size-4 mr-2" aria-hidden="true" />
                      Копировать приглашение
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку ниже, чтобы сгенерировать персонализированное
                  приглашение с ссылкой на интервью. Текст можно будет
                  скопировать и отправить кандидату через kwork.ru.
                </p>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full min-h-[44px]"
                  aria-label="Сгенерировать приглашение"
                >
                  {isGenerating ? (
                    <>
                      <IconLoader2
                        className="size-4 mr-2 animate-spin"
                        aria-hidden="true"
                      />
                      Генерация…
                    </>
                  ) : (
                    <>
                      <IconMessagePlus
                        className="size-4 mr-2"
                        aria-hidden="true"
                      />
                      Сгенерировать приглашение
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
