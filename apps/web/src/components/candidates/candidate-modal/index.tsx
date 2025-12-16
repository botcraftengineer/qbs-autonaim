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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { MatchScoreCircle } from "../match-score-circle";
import type { FunnelCandidate } from "../types";
import { ActivityTimeline } from "./activity-timeline";
import { CandidateInfo } from "./candidate-info";
import { ChatSection } from "./chat-section";

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
  const [selectedStatus, setSelectedStatus] = useState(
    candidate?.stage ?? "REVIEW",
  );
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    setSelectedStatus(candidate?.stage ?? "REVIEW");
  }, [candidate?.stage]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateStage = useMutation({
    ...trpc.candidates.updateStage.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      toast.success("Статус обновлен");
    },
    onError: () => {
      toast.error("Не удалось обновить статус");
    },
  });

  if (!candidate) return null;

  const handleStatusChange = (stage: string) => {
    setSelectedStatus(stage);
    updateStage.mutate({
      candidateId: candidate.id,
      workspaceId,
      stage: stage as "NEW" | "REVIEW" | "INTERVIEW" | "HIRED" | "REJECTED",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl h-[90vh] p-0 gap-0 flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border shrink-0">
                <AvatarImage
                  src={candidate.avatar ?? undefined}
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
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Новые</SelectItem>
                  <SelectItem value="REVIEW">На рассмотрении</SelectItem>
                  <SelectItem value="INTERVIEW">Собеседование</SelectItem>
                  <SelectItem value="HIRED">Наняты</SelectItem>
                  <SelectItem value="REJECTED">Отклонен</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CandidateInfo
              candidate={candidate}
              onAction={(action) => {
                console.log("Action:", action);
                toast.info(`Действие: ${action}`);
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
                    candidateAvatar={candidate.avatar}
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
    </Dialog>
  );
}
