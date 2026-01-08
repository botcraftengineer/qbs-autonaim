"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Filter,
  Loader2,
  MessageSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { ResponseListCard } from "~/components/gig";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

function ResponsesSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <Card key={`skeleton-${id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GigResponsesPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [activeTab, setActiveTab] = React.useState("all");
  const [messageText, setMessageText] = React.useState("");

  const [messageDialog, setMessageDialog] = React.useState<{
    open: boolean;
    responseId: string;
    candidateName?: string | null;
  }>({ open: false, responseId: "", candidateName: "" });

  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    responseId: string;
    action: "accept" | "reject";
    candidateName?: string | null;
  }>({ open: false, responseId: "", action: "accept", candidateName: "" });

  // Fetch gig info
  const { data: gig } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Fetch responses
  const { data: responses, isLoading } = useQuery({
    ...trpc.gig.responses.list.queryOptions({
      gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Mutations
  const acceptMutation = useMutation(
    trpc.gig.responses.accept.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Отклик принят");
        setConfirmDialog({ open: false, responseId: "", action: "accept" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.gig.responses.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Отклик отклонен");
        setConfirmDialog({ open: false, responseId: "", action: "reject" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const sendMessageMutation = useMutation(
    trpc.gig.responses.sendMessage.mutationOptions({
      onSuccess: () => {
        toast.success("Сообщение отправлено");
        setMessageDialog({ open: false, responseId: "" });
        setMessageText("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Handlers
  const handleAccept = (responseId: string) => {
    const response = responses?.find((r) => r.id === responseId);
    setConfirmDialog({
      open: true,
      responseId,
      action: "accept",
      candidateName: response?.candidateName,
    });
  };

  const handleReject = (responseId: string) => {
    const response = responses?.find((r) => r.id === responseId);
    setConfirmDialog({
      open: true,
      responseId,
      action: "reject",
      candidateName: response?.candidateName,
    });
  };

  const handleMessage = (responseId: string) => {
    const response = responses?.find((r) => r.id === responseId);
    setMessageDialog({
      open: true,
      responseId,
      candidateName: response?.candidateName,
    });
  };

  const handleConfirmAction = () => {
    if (!workspace?.id) return;

    if (confirmDialog.action === "accept") {
      acceptMutation.mutate({
        responseId: confirmDialog.responseId,
        workspaceId: workspace.id,
      });
    } else {
      rejectMutation.mutate({
        responseId: confirmDialog.responseId,
        workspaceId: workspace.id,
      });
    }
  };

  const handleSendMessage = () => {
    if (!workspace?.id || !messageText.trim()) return;

    sendMessageMutation.mutate({
      responseId: messageDialog.responseId,
      workspaceId: workspace.id,
      message: messageText.trim(),
    });
  };

  // Filtering
  const filteredResponses = React.useMemo(() => {
    if (!responses) return [];

    return responses.filter((response) => {
      const matchesSearch =
        !searchQuery ||
        response.candidateName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        response.candidateId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || response.status === statusFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "new" && response.status === "NEW") ||
        (activeTab === "evaluated" && response.status === "EVALUATED") ||
        (activeTab === "recommended" &&
          response.hrSelectionStatus === "RECOMMENDED");

      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [responses, searchQuery, statusFilter, activeTab]);

  const stats = React.useMemo(() => {
    if (!responses) return { total: 0, new: 0, evaluated: 0, recommended: 0 };

    return {
      total: responses.length,
      new: responses.filter((r) => r.status === "NEW").length,
      evaluated: responses.filter((r) => r.status === "EVALUATED").length,
      recommended: responses.filter(
        (r) => r.hrSelectionStatus === "RECOMMENDED",
      ).length,
    };
  }, [responses]);

  const isProcessing =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    sendMessageMutation.isPending;

  if (isLoading) {
    return <ResponsesSkeleton />;
  }

  if (!gig) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-7xl py-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заданию
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Отклики на задание</CardTitle>
                <CardDescription className="mt-1.5">
                  {gig.title}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {stats.total}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени кандидата…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="NEW">Новые</SelectItem>
                  <SelectItem value="EVALUATED">Оценены</SelectItem>
                  <SelectItem value="INTERVIEW">Интервью</SelectItem>
                  <SelectItem value="NEGOTIATION">Переговоры</SelectItem>
                  <SelectItem value="COMPLETED">Завершены</SelectItem>
                  <SelectItem value="SKIPPED">Пропущены</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Все ({stats.total})</TabsTrigger>
            <TabsTrigger value="new">Новые ({stats.new})</TabsTrigger>
            <TabsTrigger value="evaluated">
              Оценены ({stats.evaluated})
            </TabsTrigger>
            <TabsTrigger value="recommended">
              Рекомендованы ({stats.recommended})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredResponses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Нет откликов</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== "all"
                        ? "Попробуйте изменить фильтры поиска"
                        : "Пока что никто не откликнулся на это задание"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResponses.map((response) => (
                  <ResponseListCard
                    key={response.id}
                    response={response}
                    orgSlug={orgSlug}
                    workspaceSlug={workspaceSlug}
                    gigId={gigId}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onMessage={handleMessage}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
              {confirmDialog.candidateName && (
                <span className="font-medium">
                  {confirmDialog.candidateName}
                </span>
              )}
              {confirmDialog.action === "accept"
                ? " — вы уверены, что хотите принять этот отклик? Кандидат будет уведомлен."
                : " — вы уверены, что хотите отклонить этот отклик? Это действие нельзя отменить."}
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
      <Dialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog({ ...messageDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить сообщение</DialogTitle>
            <DialogDescription>
              Напишите сообщение кандидату{" "}
              {messageDialog.candidateName && (
                <span className="font-medium">
                  {messageDialog.candidateName}
                </span>
              )}
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
              onClick={() => {
                setMessageDialog({ open: false, responseId: "" });
                setMessageText("");
              }}
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
