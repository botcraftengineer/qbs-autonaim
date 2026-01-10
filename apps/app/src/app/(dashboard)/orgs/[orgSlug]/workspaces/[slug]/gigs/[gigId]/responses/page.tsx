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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Check,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

function ResponsesSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl py-4 px-4 sm:py-6 sm:px-6">
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-6 sm:h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((id) => (
                  <TableRow key={`skeleton-${id}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
  const {
    data: gig,
    isLoading: isGigLoading,
    isError: isGigError,
  } = useQuery({
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

  const router = useRouter();

  // Redirect to not-found if gig doesn't exist
  React.useEffect(() => {
    if (!isGigLoading && (!gig || isGigError)) {
      router.push("/404");
    }
  }, [isGigLoading, gig, isGigError, router]);

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: "Новый",
      EVALUATED: "Оценен",
      INTERVIEW: "Интервью",
      NEGOTIATION: "Переговоры",
      COMPLETED: "Завершен",
      SKIPPED: "Пропущен",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      NEW: "default",
      EVALUATED: "secondary",
      INTERVIEW: "outline",
      NEGOTIATION: "outline",
      COMPLETED: "secondary",
      SKIPPED: "destructive",
    };
    return variants[status] || "default";
  };

  const getHrStatusLabel = (status: string | null) => {
    if (!status) return null;
    const labels: Record<string, string> = {
      RECOMMENDED: "Рекомендован",
      NOT_RECOMMENDED: "Не рекомендован",
      PENDING: "На рассмотрении",
    };
    return labels[status] || status;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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

  if (isLoading || isGigLoading) {
    return <ResponsesSkeleton />;
  }

  if (!gig) {
    return null; // useEffect will handle redirect
  }

  return (
    <div className="container mx-auto max-w-7xl py-4 px-4 sm:py-6 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-action-manipulation min-h-[44px] sm:min-h-[24px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заданию
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl break-words">
                  Отклики на задание
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs sm:text-sm break-words">
                  {gig.title}
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="text-sm sm:text-base px-2 py-0.5 sm:px-3 sm:py-1 flex-shrink-0"
              >
                {stats.total}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Поиск по имени кандидата…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 touch-action-manipulation">
                  <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger
              value="all"
              className="min-h-[44px] sm:min-h-[36px] text-xs sm:text-sm touch-action-manipulation"
            >
              <span className="hidden sm:inline">Все ({stats.total})</span>
              <span className="sm:hidden">Все</span>
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="min-h-[44px] sm:min-h-[36px] text-xs sm:text-sm touch-action-manipulation"
            >
              <span className="hidden sm:inline">Новые ({stats.new})</span>
              <span className="sm:hidden">Новые</span>
            </TabsTrigger>
            <TabsTrigger
              value="evaluated"
              className="min-h-[44px] sm:min-h-[36px] text-xs sm:text-sm touch-action-manipulation"
            >
              <span className="hidden sm:inline">
                Оценены ({stats.evaluated})
              </span>
              <span className="sm:hidden">Оценены</span>
            </TabsTrigger>
            <TabsTrigger
              value="recommended"
              className="min-h-[44px] sm:min-h-[36px] text-xs sm:text-sm touch-action-manipulation"
            >
              <span className="hidden sm:inline">
                Рекомендованы ({stats.recommended})
              </span>
              <span className="sm:hidden">Рекоменд.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 sm:mt-6">
            {filteredResponses.length === 0 ? (
              <Card>
                <CardContent className="p-4 sm:pt-6 sm:px-6 sm:pb-6">
                  <div className="text-center py-8 sm:py-12">
                    <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">
                      Нет откликов
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground px-4">
                      {searchQuery || statusFilter !== "all"
                        ? "Попробуйте изменить фильтры поиска"
                        : "Пока что никто не откликнулся на это задание"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            Кандидат
                          </TableHead>
                          <TableHead className="min-w-[120px]">
                            Статус
                          </TableHead>
                          <TableHead className="min-w-[140px]">
                            HR статус
                          </TableHead>
                          <TableHead className="min-w-[120px]">Дата</TableHead>
                          <TableHead className="w-[180px] text-right">
                            Действия
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResponses.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell>
                              <Link
                                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${response.id}`}
                                className="font-medium hover:underline"
                              >
                                {response.candidateName || "Без имени"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusVariant(response.status)}
                              >
                                {getStatusLabel(response.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {response.hrSelectionStatus ? (
                                <Badge variant="outline">
                                  {getHrStatusLabel(response.hrSelectionStatus)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(response.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMessage(response.id)}
                                  className="h-8 w-8 p-0 touch-action-manipulation"
                                  title="Отправить сообщение"
                                  aria-label={`Отправить сообщение кандидату ${response.candidateName || "без имени"}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAccept(response.id)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 touch-action-manipulation"
                                  title="Принять"
                                  aria-label={`Принять кандидата ${response.candidateName || "без имени"}`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(response.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 touch-action-manipulation"
                                  title="Отклонить"
                                  aria-label={`Отклонить кандидата ${response.candidateName || "без имени"}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {confirmDialog.action === "accept"
                ? "Принять отклик?"
                : "Отклонить отклик?"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {confirmDialog.candidateName && (
                <span className="font-medium break-words">
                  {confirmDialog.candidateName}
                </span>
              )}
              {confirmDialog.action === "accept"
                ? " — вы уверены, что хотите принять этот отклик? Кандидат будет уведомлен."
                : " — вы уверены, что хотите отклонить этот отклик? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
              disabled={isProcessing}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              Отмена
            </Button>
            <Button
              variant={
                confirmDialog.action === "accept" ? "default" : "destructive"
              }
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
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
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Отправить сообщение
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Напишите сообщение кандидату{" "}
              {messageDialog.candidateName && (
                <span className="font-medium break-words">
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
              className="resize-none text-base sm:text-sm"
              style={{ fontSize: "16px" }}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setMessageDialog({ open: false, responseId: "" });
                setMessageText("");
              }}
              disabled={isProcessing}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing || !messageText.trim()}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
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
