"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
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
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidate } from "../types";
import { ActivityTimeline } from "./activity-timeline";
import { CommentsSection } from "./comments-section";
import { ContactInfo } from "./contact-info";
import { ProfessionalInfo } from "./professional-info";
import { SkillsSection } from "./skills-section";

interface CandidateModalProps {
  candidate: FunnelCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateModal({
  candidate,
  open,
  onOpenChange,
}: CandidateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(
    candidate?.stage ?? "REVIEW",
  );

  useEffect(() => {
    setSelectedStatus(candidate?.stage ?? "REVIEW");
  }, [candidate?.stage]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    ...trpc.funnel.comments.list.queryOptions({
      candidateId: candidate?.id ?? "",
    }),
    enabled: !!candidate,
  });

  const { data: activities } = useQuery({
    ...trpc.funnel.activities.list.queryOptions({
      candidateId: candidate?.id ?? "",
    }),
    enabled: !!candidate,
  });

  const updateStage = useMutation({
    ...trpc.funnel.updateStage.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.funnel.list.queryKey() });
    },
  });

  const addComment = useMutation({
    ...trpc.funnel.comments.add.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.funnel.comments.list.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.funnel.activities.list.queryKey(),
      });
    },
  });

  const deleteComment = useMutation({
    ...trpc.funnel.comments.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.funnel.comments.list.queryKey(),
      });
    },
  });

  if (!candidate) return null;

  const handleStatusChange = (stage: string) => {
    setSelectedStatus(stage);
    updateStage.mutate({
      candidateId: candidate.id,
      stage: stage as "NEW" | "REVIEW" | "INTERVIEW" | "HIRED" | "REJECTED",
    });
  };

  const handleAddComment = (content: string, isPrivate: boolean) => {
    addComment.mutate({ candidateId: candidate.id, content, isPrivate });
  };

  const getMatchScoreColor = () => {
    if (candidate.matchScore >= 80)
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (candidate.matchScore >= 50)
      return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 space-y-4 border-b bg-muted/30">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 ring-4 ring-primary/5">
              <AvatarImage
                src={candidate.avatar ?? undefined}
                alt={candidate.name}
              />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {candidate.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-semibold leading-tight">
                {candidate.name}
              </DialogTitle>
              <p className="text-base text-muted-foreground mt-1.5 font-medium">
                {candidate.position}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Badge
                  variant="outline"
                  className={`text-sm font-semibold px-3 py-1 border ${getMatchScoreColor()}`}
                >
                  <Award className="h-3.5 w-3.5 mr-1.5" />
                  {candidate.matchScore}% совпадение
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">Новые кандидаты</SelectItem>
                <SelectItem value="REVIEW">На рассмотрении</SelectItem>
                <SelectItem value="INTERVIEW">Собеседование</SelectItem>
                <SelectItem value="HIRED">Наняты</SelectItem>
                <SelectItem value="REJECTED">Отклонен</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-8 w-px bg-border" />
            <Button variant="outline" size="sm" className="gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Одобрить
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              Отклонить
            </Button>
            <Button variant="outline" size="sm" className="gap-2 ml-auto">
              <MessageSquare className="h-4 w-4" />
              Написать
            </Button>
          </div>

          <ContactInfo candidate={candidate} />
          <Separator />
          <ProfessionalInfo candidate={candidate} />
          <Separator />
          <SkillsSection skills={candidate.skills} />
          <Separator />

          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="timeline">
                <Clock className="h-4 w-4 mr-2" />
                Временная шкала
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Комментарии ({comments?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <ActivityTimeline activities={activities ?? []} />
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <CommentsSection
                comments={comments ?? []}
                onAddComment={handleAddComment}
                onDeleteComment={(id) =>
                  deleteComment.mutate({ commentId: id })
                }
                isAdding={addComment.isPending}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Скачать резюме
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
