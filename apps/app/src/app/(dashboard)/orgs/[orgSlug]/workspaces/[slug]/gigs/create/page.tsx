"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileEdit, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

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
  { value: "CONSULTING", label: "Консалтинг" },
  { value: "OTHER", label: "Другое" },
] as const;

const formSchema = z.object({
  title: z.string().min(1, "Укажите название задания").max(500),
  description: z.string(),
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
    "OTHER",
  ]),
  budgetMin: z.string(),
  budgetMax: z.string(),
  budgetCurrency: z.string().length(3),
  deadline: z.string(),
  estimatedDuration: z.string().max(100),
  deliverables: z.string(),
  requiredSkills: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface PageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
  }>;
}

export default function CreateGigPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { orgSlug, slug: workspaceSlug } = resolvedParams;

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"manual" | "ai">("manual");
  const [aiMessage, setAiMessage] = React.useState("");
  const [conversationHistory, setConversationHistory] = React.useState<
    ConversationMessage[]
  >([]);
  const [isAiGenerating, setIsAiGenerating] = React.useState(false);

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
      deliverables: "",
      requiredSkills: "",
    },
  });

  const { mutate: createGig, isPending: isCreating } = useMutation(
    trpc.gig.create.mutationOptions({
      onSuccess: () => {
        toast.success("Задание создано");
        queryClient.invalidateQueries({
          queryKey: trpc.gig.list.queryKey(),
        });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось создать задание");
      },
    }),
  );

  const { mutate: generateWithAi } = useMutation(
    trpc.gig.chatGenerate.mutationOptions({
      onMutate: () => {
        setIsAiGenerating(true);
      },
      onSuccess: (data) => {
        const doc = data.document;

        if (doc.title) form.setValue("title", doc.title);
        if (doc.description) form.setValue("description", doc.description);
        if (doc.deliverables) form.setValue("deliverables", doc.deliverables);
        if (doc.requiredSkills)
          form.setValue("requiredSkills", doc.requiredSkills);
        if (doc.timeline) form.setValue("estimatedDuration", doc.timeline);

        if (doc.budgetRange) {
          const match = doc.budgetRange.match(/(\d+)[-–](\d+)/);
          if (match) {
            form.setValue("budgetMin", match[1] || "");
            form.setValue("budgetMax", match[2] || "");
          }
        }

        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: aiMessage },
          { role: "assistant", content: JSON.stringify(doc, null, 2) },
        ]);
        setAiMessage("");
        toast.success("Документ обновлён");
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось сгенерировать");
      },
      onSettled: () => {
        setIsAiGenerating(false);
      },
    }),
  );

  const handleAiGenerate = () => {
    if (!aiMessage.trim()) {
      toast.error("Введите сообщение");
      return;
    }

    const currentValues = form.getValues();
    generateWithAi({
      workspaceId: workspaceSlug,
      message: aiMessage,
      currentDocument: {
        title: currentValues.title,
        description: currentValues.description,
        deliverables: currentValues.deliverables,
        requiredSkills: currentValues.requiredSkills,
        budgetRange:
          currentValues.budgetMin && currentValues.budgetMax
            ? `${currentValues.budgetMin}-${currentValues.budgetMax} ${currentValues.budgetCurrency}`
            : undefined,
        timeline: currentValues.estimatedDuration,
      },
      conversationHistory: conversationHistory.slice(-10),
    });
  };

  const onSubmit = (values: FormValues) => {
    const budgetMin = values.budgetMin
      ? Number.parseInt(values.budgetMin)
      : undefined;
    const budgetMax = values.budgetMax
      ? Number.parseInt(values.budgetMax)
      : undefined;

    createGig({
      workspaceId: workspaceSlug,
      title: values.title,
      description: values.description || undefined,
      type: values.type,
      budgetMin,
      budgetMax,
      budgetCurrency: values.budgetCurrency,
      deadline: values.deadline
        ? new Date(values.deadline).toISOString()
        : undefined,
      estimatedDuration: values.estimatedDuration || undefined,
      deliverables: values.deliverables || undefined,
      requiredSkills: values.requiredSkills || undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заданиям
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Создать задание</h1>
        <p className="text-muted-foreground mt-2">
          Создайте новое разовое задание для фрилансеров
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "manual" | "ai")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="manual" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Ручное заполнение
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI помощник
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">AI помощник</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Опишите задание своими словами, и AI поможет структурировать
              информацию
            </p>

            {conversationHistory.length > 0 && (
              <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
                {conversationHistory.map((msg, idx) => (
                  <div
                    key={`msg-${idx}-${msg.role}`}
                    className={`text-sm p-3 rounded ${
                      msg.role === "user"
                        ? "bg-primary/10 ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <div className="font-medium mb-1">
                      {msg.role === "user" ? "Вы" : "AI"}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                placeholder="Например: Нужно сделать лендинг для стартапа на Next.js, бюджет 50-70 тысяч, срок 2 недели..."
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAiGenerate();
                  }
                }}
                className="min-h-[100px]"
                disabled={isAiGenerating}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                ⌘/Ctrl + Enter для отправки
              </p>
              <Button
                onClick={handleAiGenerate}
                disabled={isAiGenerating || !aiMessage.trim()}
                size="sm"
              >
                {isAiGenerating ? "Генерация…" : "Сгенерировать"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <p className="text-sm text-muted-foreground mb-4">
            Заполните форму вручную или используйте AI помощник
          </p>
        </TabsContent>
      </Tabs>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название задания *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Например: Разработка лендинга для стартапа"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип задания</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание проекта</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Опишите контекст и общую информацию о проекте"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Общая информация о проекте и контекст
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliverables"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Что нужно сделать</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Список конкретных результатов и задач"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Конкретные результаты, которые должны быть получены
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiredSkills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Требуемые навыки</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Например: React, TypeScript, Tailwind CSS"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Технологии и навыки, необходимые для выполнения
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="budgetMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Бюджет от</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50000" {...field} />
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
                  <FormLabel>Бюджет до</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="70000" {...field} />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ориентировочные сроки</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: 2 недели, 3-5 дней"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Примерное время выполнения</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дедлайн</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>Крайний срок сдачи проекта</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Создание…" : "Создать задание"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
