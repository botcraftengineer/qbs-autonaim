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
  title: z.string().min(1, "Название обязательно").max(500, "Максимум 500 символов"),
  description: z.string().optional(),
  type: z.enum([
    "DEVELOPMENT",
    "DESIGN", 
    "COPYWRITING",
    "MARKETING",
    "TRANSLATION",
    "VIDEO",
    "AUDIO",
    "DATA_ENTRY",
    "RESEARCH",
    "CONSULTING",
    "OTHER"
  ]),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  budgetCurrency: z.string().default("RUB"),
  deadline: z.string().optional(),
  estimatedDuration: z.string().optional(),
  url: z.string().url("Некорректный URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
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

  const { data: gig, isLoading } = useQuery(
    trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspace?.id ?? "",
    }),
    {
      enabled: !!workspace?.id,
    }
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "OTHER",
      budgetMin: "",
      budgetMax: "",
      budgetCurrency: "RUB",
      deadline: "",
      estimatedDuration: "",
      url: "",
      isActive: true,
      customBotInstructions: "",
      customScreeningPrompt: "",
      customInterviewQuestions: "",
    },
  });

  // Заполняем форму данными gig при загрузке
  React.useEffect(() => {
    if (gig) {
      form.reset({
        title: gig.title,
        description: gig.description || "",
        type: gig.type,
        budgetMin: gig.budgetMin?.toString() || "",
        budgetMax: gig.budgetMax?.toString() || "",
        budgetCurrency: gig.budgetCurrency || "RUB",
        deadline: gig.deadline ? gig.deadline.toISOString().split('T')[0] : "",
        estimatedDuration: gig.estimatedDuration || "",
        url: gig.url || "",
        isActive: gig.isActive,
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
      id: gigId,
      workspaceId: workspace.id,
      title: values.title,
      description: values.description || undefined,
      type: values.type,
      budgetMin: values.budgetMin ? parseInt(values.budgetMin) : undefined,
      budgetMax: values.budgetMax ? parseInt(values.budgetMax) : undefined,
      budgetCurrency: values.budgetCurrency,
      deadline: values.deadline ? new Date(values.deadline) : undefined,
      estimatedDuration: values.estimatedDuration || undefined,
      url: values.url || undefined,
      isActive: values.isActive,
      customBotInstructions: values.customBotInstructions || undefined,
      customScreeningPrompt: values.customScreeningPrompt || undefined,
      customInterviewQuestions: values.customInterviewQuestions || undefined,
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Основные детали задания
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название задания</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название задания..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Подробное описание задания..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип задания</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gigTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Активное задание</FormLabel>
                        <FormDescription>
                          Активные задания видны кандидатам
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Бюджет и сроки</CardTitle>
              <CardDescription>
                Финансовые условия и временные рамки
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Минимальный бюджет</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Максимальный бюджет</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Валюта</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RUB">RUB</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дедлайн</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ожидаемая длительность</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="например: 1-2 недели"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* External Link */}
          <Card>
            <CardHeader>
              <CardTitle>Внешняя ссылка</CardTitle>
              <CardDescription>
                Ссылка на задание на внешней платформе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/job/123"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* AI Settings */}
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