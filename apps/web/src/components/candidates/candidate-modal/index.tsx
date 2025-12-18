"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, MessageSquare, StickyNote, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  triggerRefreshSingleResume,
  triggerSendWelcome,
} from "~/actions/trigger";
import { useAvatarUrl } from "~/hooks/use-avatar-url";
import { useTRPC } from "~/trpc/react";
import { MatchScoreCircle } from "../match-score-circle";
import type { FunnelCandidate } from "../types";
import { ActivityTimeline } from "./activity-timeline";
import { CandidateInfo } from "./candidate-info";
import { ChatSection } from "./chat-section";
import { CommentsSection } from "./comments-section";
import { RejectDialog } from "./reject-dialog";
import { SendOfferDialog } from "./send-offer-dialog";

interface CandidateModalProps {
  candidate: FunnelCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function CandidateModal({
  candidate,
  open,
  onOpenChange,
  workspaceId,
}: CandidateModalProps) {
  const avatarUrl = useAvatarUrl(candidate?.avatarFileId);
  const [selectedStatus, setSelectedStatus] = useState(
    candidate?.stage ?? "REVIEW",
  );
  const [activeTab, setActiveTab] = useState("chat");
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    setSelectedStatus(candidate?.stage ?? "REVIEW");
  }, [candidate?.stage]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isSendingGreeting, setIsSendingGreeting] = useState(false);
  const [isRefreshingResume, setIsRefreshingResume] = useState(false);

  const inviteCandidateMutation = useMutation({
    ...trpc.candidates.inviteCandidate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      toast.success("Кандидат приглашён");
    },
    onError: () => {
      toast.error("Не удалось пригласить кандидата");
    },
  });

  const handleSendGreeting = async () => {
    if (!candidate?.telegram && !candidate?.phone) {
      toast.error(
        "У кандидата не указаны ни Telegram username, ни номер телефона",
      );
      return;
    }

    setIsSendingGreeting(true);
    try {
      const result = await triggerSendWelcome(
        candidate.id,
        candidate.telegram,
        candidate.phone,
      );
      if (!result.success) {
        toast.error("Не удалось отправить приветствие");
        return;
      }
      toast.success(
        `Приветствие отправлено ${candidate.name ? candidate.name : candidate.telegram ? `@${candidate.telegram}` : candidate.phone}`,
      );
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
    } catch (error) {
      console.error("Ошибка отправки приветствия:", error);
      toast.error("Ошибка отправки приветствия");
    } finally {
      setIsSendingGreeting(false);
    }
  };

  const handleRefreshResume = async () => {
    if (!candidate) return;

    setIsRefreshingResume(true);
    try {
      const result = await triggerRefreshSingleResume(candidate.id);
      if (!result.success) {
        toast.error("Не удалось обновить резюме");
        return;
      }
      toast.success("Обновление резюме запущено");
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
    } catch (error) {
      console.error("Ошибка обновления резюме:", error);
      toast.error("Ошибка обновления резюме");
    } finally {
      setIsRefreshingResume(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-w-[90vw] h-[90vh] p-0 gap-0 flex flex-col overscroll-contain"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border shrink-0">
                <AvatarImage
                  src={avatarUrl ?? undefined}
                  alt={candidate.name}
                />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {candidate.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold truncate">
                  {candidate.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {candidate.position}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <MatchScoreCircle score={candidate.matchScore} size="md" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Статус:</span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-muted">
                {selectedStatus === "NEW" && "Новые"}
                {selectedStatus === "REVIEW" && "На рассмотрении"}
                {selectedStatus === "INTERVIEW" && "Собеседование"}
                {selectedStatus === "OFFER" && "Оффер"}
                {selectedStatus === "HIRED" && "Наняты"}
                {selectedStatus === "REJECTED" && "Отклонен"}
              </span>
            </div>

            <CandidateInfo
              candidate={candidate}
              isLoading={{
                sendGreeting: isSendingGreeting,
                invite: inviteCandidateMutation.isPending,
                refreshResume: isRefreshingResume,
              }}
              onAction={(action) => {
                switch (action) {
                  case "send-greeting":
                    void handleSendGreeting();
                    break;
                  case "send-offer":
                    setShowOfferDialog(true);
                    break;
                  case "invite":
                    inviteCandidateMutation.mutate({
                      candidateId: candidate.id,
                      workspaceId,
                    });
                    break;
                  case "rate":
                    toast.info("Функция оценки в разработке");
                    break;
                  case "view-resume":
                    if (candidate.resumeUrl) {
                      window.open(candidate.resumeUrl, "_blank");
                    } else {
                      toast.error("Резюме недоступно");
                    }
                    break;
                  case "refresh-resume":
                    void handleRefreshResume();
                    break;
                  case "reject":
                    setShowRejectDialog(true);
                    break;
                  default:
                    console.log("Unknown action:", action);
                }
              }}
            />

            <div className="border-t pt-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <TabsList className="w-full justify-start h-10 bg-transparent border-b rounded-none p-0">
                  <TabsTrigger
                    value="chat"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Чат
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                    Заметки
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    История
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="m-0 min-h-[400px]">
                  <ChatSection
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                    workspaceId={workspaceId}
                  />
                </TabsContent>

                <TabsContent value="comments" className="m-0 min-h-[400px]">
                  <CommentsSection
                    candidateId={candidate.id}
                    workspaceId={workspaceId}
                  />
                </TabsContent>

                <TabsContent value="activity" className="m-0 min-h-[400px]">
                  <ActivityTimeline
                    candidateId={candidate.id}
                    workspaceId={workspaceId}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>

      <SendOfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        candidate={candidate}
        workspaceId={workspaceId}
      />

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        candidate={candidate}
        workspaceId={workspaceId}
      />
    </Dialog>
  );
}
