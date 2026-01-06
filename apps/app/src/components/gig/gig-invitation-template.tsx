"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Textarea,
} from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconCopy,
  IconLink,
  IconLoader2,
} from "@tabler/icons-react";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface GigInvitationTemplateProps {
  gigId: string;
  gigTitle: string;
}

export function GigInvitationTemplate({
  gigId,
  gigTitle,
}: GigInvitationTemplateProps) {
  const [copied, setCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const { data: interviewLink, isLoading: isLoadingLink } = useQuery(
    workspace?.id
      ? trpc.gig.getInterviewLink.queryOptions({
          gigId,
          workspaceId: workspace.id,
        })
      : skipToken,
  );

  const { mutate: generateLink, isPending: isGenerating } = useMutation({
    ...trpc.gig.generateInterviewLink.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.getInterviewLink.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Ссылка на интервью создана");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  });

  const handleGenerateLink = useCallback(() => {
    if (!workspace?.id) return;
    generateLink({ gigId, workspaceId: workspace.id });
  }, [generateLink, gigId, workspace?.id]);

  const template = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qbs.app";
    const interviewUrl =
      interviewLink?.url || `${baseUrl}/gig-interview/[ссылка]`;

    const lines = [
      "Здравствуйте!",
      "",
      `Спасибо за отклик на задание "${gigTitle}".`,
      "",
      "Для продолжения, пожалуйста, пройдите короткое интервью с нашим AI-ассистентом (5-10 минут):",
      interviewUrl,
      "",
      "После интервью мы свяжемся с вами для обсуждения деталей.",
    ];

    return lines.join("\n");
  }, [gigTitle, interviewLink?.url]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      toast.success("Шаблон скопирован");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [template]);

  if (isLoadingLink) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаблон приглашения</CardTitle>
        <CardDescription>
          Скопируйте и отправьте кандидатам через kwork.ru для прохождения
          интервью
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!interviewLink && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="mb-3">
              Создайте ссылку на интервью, чтобы использовать шаблон приглашения
            </p>
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="min-h-[36px]"
              aria-label="Создать ссылку на интервью"
            >
              {isGenerating ? (
                <>
                  <IconLoader2
                    className="size-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                  Создание…
                </>
              ) : (
                <>
                  <IconLink className="size-4 mr-2" aria-hidden="true" />
                  Создать ссылку на интервью
                </>
              )}
            </Button>
          </div>
        )}

        <Textarea
          value={template}
          readOnly
          rows={10}
          className="resize-none font-mono text-sm"
          aria-label="Текст шаблона приглашения"
        />

        <Button
          onClick={handleCopy}
          variant="outline"
          className="w-full min-h-[44px]"
          aria-label="Скопировать шаблон приглашения"
        >
          {copied ? (
            <>
              <IconCheck className="size-4 mr-2" aria-hidden="true" />
              Скопировано
            </>
          ) : (
            <>
              <IconCopy className="size-4 mr-2" aria-hidden="true" />
              Копировать шаблон
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
