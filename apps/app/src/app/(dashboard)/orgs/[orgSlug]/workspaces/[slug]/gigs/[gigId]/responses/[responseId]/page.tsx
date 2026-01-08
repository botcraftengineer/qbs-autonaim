"use client";

import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Textarea,
  toast,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { ResponseDetailCard } from "~/components/gig/response-detail-card";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
    gigId: string;
    responseId: string;
  }>;
}

function ResponseDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-6">
      <Skeleton className="h-4 w-32" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>

      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function GigResponseDetailPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId, responseId } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [messageDialog, setMessageDialog] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    action: "accept" | "reject";
  }>({ open: false, action: "accept" });

  // Fetch response details
  const { data: response, isLoading } = useQuery({
    ...trpc.gig.responses.get.queryOptions({
      responseId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Accept mutation
  const acceptMutation = useMutation(
    trpc.gig.responses.accept.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.get.queryKey({
            responseId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Отклик принят");
        setConfirmDialog({ open: false, action: "accept" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Reject mutation
  const rejectMutation = useMutation(
    trpc.gig.responses.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.get.queryKey({
            responseId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Отклик отклонен");
        setConfirmDialog({ open: false, action: "reject" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    trpc.gig.responses.sendMessage.mutationOptions({
      onSuccess: () => {
        toast.success("Сообщение отправлено");
        setMessageDialog(false);
        setMessageText("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAccept = () => {
    setConfirmDialog({ open: true, action: "accept" });
  };

  const handleReject = () => {
    setConfirmDialog({ open: true, action: "reject" });
  };

  const handleMessage = () => {
    setMessageDialog(true);
  };

  const handleConfirmAction = () => {
    if (!workspace?.id) return;

    if (confirmDialog.action === "accept") {
      acceptMutation.mutate({
        responseId,
        workspaceId: workspace.id,
      });
    } else {
      rejectMutation.mutate({
        responseId,
        workspaceId: workspace.id,
      });
    }
  };

  const handleSendMessage = () => {
    if (!workspace?.id || !messageText.trim()) return;

    sendMessageMutation.mutate({
      responseId,
      workspaceId: workspace.id,
      message: messageText.trim(),
    });
  };

  const isProcessing =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    sendMessageMutation.isPending;

  if (isLoading) {
    return <ResponseDetailSkeleton />;
  }

  if (!response) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl py-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к откликам
        </Link>
      </div>

      {/* Response Detail */}
      <ResponseDetailCard
        response={response}
        onAccept={handleAccept}
        onReject={handleReject}
        onMessage={handleMessage}
        isProcessing={isProcessing}
      />

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "accept"
                ? "Принять отклик?"
                : "Отклонить отклик?"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "accept"
                ? "Вы уверены, что хотите принять этот отклик? Кандидат будет уведомлен."
                : "Вы уверены, что хотите отклонить этот отклик? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              disabled={isProcessing}
            >
              Отмена
            </Button>
            <Button
              variant={
                confirmDialog.action === "accept" ? "default" : "destructive"
              }
              onClick={handleConfirmAction}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {confirmDialog.action === "accept" ? "Принять" : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить сообщение</DialogTitle>
            <DialogDescription>
              Напишите сообщение кандидату{" "}
              {response.candidateName || response.candidateId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Введите ваше сообщение…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageDialog(false)}
              disabled={isProcessing}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || !messageText.trim()}
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
