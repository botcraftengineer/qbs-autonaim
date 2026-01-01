"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  toast,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ExternalLink,
  Filter,
  MessageSquare,
  Search,
  Star,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

// Define proper Response type based on the fields used in the component
interface GigResponse {
  id: string;
  candidateId: string;
  candidateName?: string | null;
  status: string;
  hrSelectionStatus?: string | null;
  rating?: string | null;
  createdAt: Date | null;
  experience?: string | null;
  // Extended fields that may come from external sources
  source?: string;
  message?: string;
  portfolio?: string;
}

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

function ResponsesSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-6">
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

        <div className="space-y-4">
          {[1, 2, 3].map((id) => (
            <Card key={`skeleton-${id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  const statuses: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    NEW: { label: "Новый", variant: "default" },
    EVALUATED: { label: "Оценен", variant: "secondary" },
    REJECTED: { label: "Отклонен", variant: "destructive" },
    ACCEPTED: { label: "Принят", variant: "outline" },
  };

  return statuses[status] || { label: status, variant: "outline" };
}

function getHrStatusLabel(status: string) {
  const statuses: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    INVITE: { label: "Пригласить", variant: "default" },
    RECOMMENDED: { label: "Рекомендован", variant: "secondary" },
    REJECTED: { label: "Отклонен", variant: "destructive" },
    MAYBE: { label: "Возможно", variant: "outline" },
  };

  return statuses[status] || { label: status, variant: "outline" };
}

function formatDate(date: Date | null) {
  if (!date) return "Не указан";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function GigResponsesPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [activeTab, setActiveTab] = React.useState("all");

  // Modal states
  const [messageModal, setMessageModal] = React.useState<{
    open: boolean;
    responseId: string;
    candidateName?: string;
  }>({ open: false, responseId: "", candidateName: "" });

  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    responseId: string;
    action: "accept" | "reject";
    candidateName?: string;
  }>({ open: false, responseId: "", action: "accept", candidateName: "" });

  // Получаем информацию о gig
  const { data: gig } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Получаем отклики
  const { data: responses, isLoading } = useQuery({
    ...trpc.gig.responses.list.queryOptions({
      gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Mutations - using existing updateStatus for now, TODO: use dedicated accept/reject/sendMessage mutations
  const acceptMutation = useMutation(
    trpc.gig.responses.updateStatus.mutationOptions({
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
      onError: (error: { message: string }) => {
        toast.error(error.message);
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.gig.responses.updateStatus.mutationOptions({
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
      onError: (error: { message: string }) => {
        toast.error(error.message);
      },
    }),
  );

  // TODO: Replace with actual sendMessage mutation when available
  const sendMessageMutation = useMutation(
    trpc.gig.responses.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.responses.list.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        toast.success("Сообщение отправлено");
        setMessageModal({ open: false, responseId: "" });
      },
      onError: (error: { message: string }) => {
        toast.error(error.message);
      },
    }),
  );

  // Action handlers
  const handleAccept = (responseId: string, candidateName?: string) => {
    setConfirmDialog({
      open: true,
      responseId,
      action: "accept",
      candidateName,
    });
  };

  const handleReject = (responseId: string, candidateName?: string) => {
    setConfirmDialog({
      open: true,
      responseId,
      action: "reject",
      candidateName,
    });
  };

  const handleMessage = (responseId: string, candidateName?: string) => {
    setMessageModal({
      open: true,
      responseId,
      candidateName,
    });
  };

  const handleConfirmAction = () => {
    if (!workspace?.id) return;

    if (confirmDialog.action === "accept") {
      acceptMutation.mutate({
        responseId: confirmDialog.responseId,
        workspaceId: workspace.id,
        status: "EVALUATED",
        hrSelectionStatus: "RECOMMENDED",
      });
    } else {
      rejectMutation.mutate({
        responseId: confirmDialog.responseId,
        workspaceId: workspace.id,
        status: "EVALUATED",
        hrSelectionStatus: "REJECTED",
      });
    }
  };

  const handleSendMessage = (message: string) => {
    if (!workspace?.id) return;

    // TODO: Implement actual message sending
    sendMessageMutation.mutate({
      responseId: messageModal.responseId,
      workspaceId: workspace.id,
      status: "EVALUATED",
    });
  };

  // Фильтрация откликов
  const filteredResponses = React.useMemo(() => {
    if (!responses) return [];

    return (responses as GigResponse[]).filter((response) => {
      // Поиск по имени кандидата
      const matchesSearch =
        !searchQuery ||
        response.candidateName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        response.candidateId.toLowerCase().includes(searchQuery.toLowerCase());

      // Фильтр по статусу
      const matchesStatus =
        statusFilter === "all" || response.status === statusFilter;

      // Фильтр по табам
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

    const typedResponses = responses as GigResponse[];
    return {
      total: typedResponses.length,
      new: typedResponses.filter((r) => r.status === "NEW").length,
      evaluated: typedResponses.filter((r) => r.status === "EVALUATED").length,
      recommended: typedResponses.filter(
        (r) => r.hrSelectionStatus === "RECOMMENDED",
      ).length,
    };
  }, [responses]);

  if (isLoading) {
    return <ResponsesSkeleton />;
  }

  if (!gig) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-6xl py-6">
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
            <CardTitle>Отклики на задание</CardTitle>
            <CardDescription>
              {gig.title} • Всего откликов: {stats.total}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени кандидата..."
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
                  <SelectItem value="REJECTED">Отклонены</SelectItem>
                  <SelectItem value="ACCEPTED">Приняты</SelectItem>
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

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredResponses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
              filteredResponses.map((response) => (
                <Card
                  key={response.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium">
                              {response.candidateName || response.candidateId}
                            </h3>
                          </div>

                          {response.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {response.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(response.createdAt)}
                          </div>

                          {response.source && response.source !== "MANUAL" && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="h-4 w-4" />
                              {response.source}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {response.hrSelectionStatus && (
                          <Badge
                            variant={
                              getHrStatusLabel(response.hrSelectionStatus)
                                .variant
                            }
                          >
                            {getHrStatusLabel(response.hrSelectionStatus).label}
                          </Badge>
                        )}

                        <Badge
                          variant={getStatusLabel(response.status).variant}
                        >
                          {getStatusLabel(response.status).label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {(response.message ||
                    response.portfolio ||
                    response.experience) && (
                    <CardContent>
                      <div className="space-y-3">
                        {response.message && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">
                              Сообщение
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {response.message}
                            </p>
                          </div>
                        )}

                        {response.portfolio && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">
                              Портфолио
                            </h4>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={response.portfolio}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Посмотреть портфолио
                              </a>
                            </Button>
                          </div>
                        )}

                        {response.experience && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">
                              Опыт работы
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {response.experience}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Button size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Принять
                        </Button>

                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Написать
                        </Button>

                        <Button size="sm" variant="ghost">
                          <XCircle className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
