"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Textarea,
} from "@qbs-autonaim/ui";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string; gigId: string }>;
}

const gigTypeOptions = [
  { value: "DEVELOPMENT", label: "Разработка" },
  { value: "DESIGN", label: "Дизайн" },
  { value: "COPYWRITING", label: "Копирайтинг" },
  { value: "MARKETING", label: "Маркетинг" },
  { value: "TRANSLATION", label: "Перевод" },
  { value: "VIDEO", label: "Видео" },
  { value: "AUDIO", label: "Аудио" },
  { value: "DATA_ENTRY", label: "Ввод данных" },
  { value: "RESEARCH", label: "Исследования" },
  { value: "CONSULTING", label: "Консультации" },
  { value: "OTHER", label: "Другое" },
];

const formSchema = z.object({
  customBotInstructions: z.string().optional(),
  customScreeningPrompt: z.string().optional(),
  customInterviewQuestions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function EditGigSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditGigPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug, gigId } = React.use(params);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const { data: gig, isLoading } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customBotInstructions: "",
      customScreeningPrompt: "",
      customInterviewQuestions: "",
    },
  });

  // Заполняем форму данными gig при загрузке
  React.useEffect(() => {
    if (gig) {
      form.reset({
        customBotInstructions: gig.customBotInstructions || "",
        customScreeningPrompt: gig.customScreeningPrompt || "",
        customInterviewQuestions: gig.customInterviewQuestions || "",
      });
    }
  }, [gig, form]);

  const { mutate: updateGig, isPending } = useMutation(
    trpc.gig.update.mutationOptions({
      onSuccess: () => {
        toast.success("Задание обновлено");
        queryClient.invalidateQueries({ queryKey: trpc.gig.get.queryKey({ id: gigId, workspaceId: workspace?.id ?? "" }) });
        queryClient.invalidateQueries({ queryKey: trpc.gig.list.queryKey() });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить задание");
      },
    })
  );

  const onSubmit = (values: FormValues) => {
    if (!workspace?.id) return;

    updateGig({
      gigId: gigId,
      workspaceId: workspace.id,
      settings: {
        customBotInstructions: values.customBotInstructions || null,
        customScreeningPrompt: values.customScreeningPrompt || null,
        customInterviewQuestions: values.customInterviewQuestions || null,
      },
    });
  };

  if (isLoading) {
    return <EditGigSkeleton />;
  }

  if (!gig) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Display */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о задании</CardTitle>
              <CardDescription>
                Основные детали задания (только для просмотра)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Название</label>
                  <p className="text-sm">{gig.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Тип</label>
                  <p className="text-sm">{gigTypeOptions.find(opt => opt.value === gig.type)?.label || gig.type}</p>
                </div>
              </div>
              {gig.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Описание</label>
                  <p className="text-sm">{gig.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gig.budgetMin && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Мин. бюджет</label>
                    <p className="text-sm">{gig.budgetMin} {gig.budgetCurrency}</p>
                  </div>
                )}
                {gig.budgetMax && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Макс. бюджет</label>
                    <p className="text-sm">{gig.budgetMax} {gig.budgetCurrency}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Статус</label>
                  <p className="text-sm">{gig.isActive ? "Активное" : "Неактивное"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings - Editable */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки ИИ</CardTitle>
              <CardDescription>
                Кастомные инструкции для автоматизации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customBotInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Инструкции для бота</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Специальные инструкции для бота при работе с откликами..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Эти инструкции будут использоваться ботом при обработке откликов
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customScreeningPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Промпт для скрининга</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Кастомный промпт для автоматического скрининга кандидатов..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Используется для автоматической оценки откликов
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customInterviewQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вопросы для интервью</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Список вопросов для интервью с кандидатами..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Вопросы, которые будут использоваться при интервью
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}