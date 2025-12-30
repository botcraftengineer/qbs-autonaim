"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Send,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

const gigTypeOptions = [
  { value: "DEVELOPMENT", label: "Разработка", emoji: "💻" },
  { value: "DESIGN", label: "Дизайн", emoji: "🎨" },
  { value: "COPYWRITING", label: "Копирайтинг", emoji: "✍️" },
  { value: "MARKETING", label: "Маркетинг", emoji: "📈" },
  { value: "TRANSLATION", label: "Перевод", emoji: "🌍" },
  { value: "VIDEO", label: "Видео", emoji: "🎬" },
  { value: "AUDIO", label: "Аудио", emoji: "🎵" },
  { value: "DATA_ENTRY", label: "Ввод данных", emoji: "📊" },
  { value: "RESEARCH", label: "Исследования", emoji: "🔬" },
  { value: "CONSULTING", label: "Консалтинг", emoji: "💼" },
  { value: "OTHER", label: "Другое", emoji: "📦" },
] as const;

const budgetRanges = [
  { value: "5000-15000", label: "5 000 – 15 000 ₽", min: 5000, max: 15000 },
  { value: "15000-30000", label: "15 000 – 30 000 ₽", min: 15000, max: 30000 },
  { value: "30000-50000", label: "30 000 – 50 000 ₽", min: 30000, max: 50000 },
  {
    value: "50000-100000",
    label: "50 000 – 100 000 ₽",
    min: 50000,
    max: 100000,
  },
  { value: "100000+", label: "100 000+ ₽", min: 100000, max: 500000 },
  { value: "custom", label: "Указать свой бюджет", min: 0, max: 0 },
];

const timelineOptions = [
  { value: "1-3 дня", label: "Срочно (1-3 дня)" },
  { value: "1 неделя", label: "1 неделя" },
  { value: "2 недели", label: "2 недели" },
  { value: "1 месяц", label: "1 месяц" },
  { value: "custom", label: "Указать свой срок" },
];

type ChatStep =
  | "welcome"
  | "type"
  | "description"
  | "skills"
  | "budget"
  | "timeline"
  | "review"
  | "complete";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: Array<{ value: string; label: string; emoji?: string }>;
  step?: ChatStep;
  isTyping?: boolean;
}

interface GigDraft {
  title: string;
  description: string;
  type: string;
  deliverables: string;
  requiredSkills: string;
  budgetMin: number | undefined;
  budgetMax: number | undefined;
  budgetCurrency: string;
  estimatedDuration: string;
}

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

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Привет! 👋 Я помогу создать техническое задание для фрилансера. Давайте начнём с типа задания. Выберите категорию или опишите задачу своими словами:",
  options: gigTypeOptions.map((t) => ({
    value: t.value,
    label: t.label,
    emoji: t.emoji,
  })),
  step: "type",
};

export default function CreateGigPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { orgSlug, slug: workspaceSlug } = resolvedParams;

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    welcomeMessage,
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [currentStep, setCurrentStep] = React.useState<ChatStep>("type");
  const [isAiThinking, setIsAiThinking] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const [draft, setDraft] = React.useState<GigDraft>({
    title: "",
    description: "",
    type: "OTHER",
    deliverables: "",
    requiredSkills: "",
    budgetMin: undefined,
    budgetMax: undefined,
    budgetCurrency: "RUB",
    estimatedDuration: "",
  });

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

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  React.useEffect(() => {
    if (!isAiThinking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAiThinking]);

  const { mutate: createGig, isPending: isCreating } = useMutation(
    trpc.gig.create.mutationOptions({
      onSuccess: () => {
        toast.success("Задание создано");
        queryClient.invalidateQueries({ queryKey: trpc.gig.list.queryKey() });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось создать задание");
      },
    }),
  );

  const { mutateAsync: generateWithAi } = useMutation(
    trpc.gig.chatGenerate.mutationOptions({
      onSuccess: (data) => {
        const doc = data.document;
        setDraft((prev) => ({
          ...prev,
          title: doc.title || prev.title,
          description: doc.description || prev.description,
          deliverables: doc.deliverables || prev.deliverables,
          requiredSkills: doc.requiredSkills || prev.requiredSkills,
          estimatedDuration: doc.timeline || prev.estimatedDuration,
        }));
        if (doc.budgetRange) {
          const match = doc.budgetRange.match(/(\d+)[-–](\d+)/);
          if (match?.[1] !== undefined && match?.[2] !== undefined) {
            const min = match[1];
            const max = match[2];
            setDraft((prev) => ({
              ...prev,
              budgetMin: Number.parseInt(min),
              budgetMax: Number.parseInt(max),
            }));
          }
        }
      },
    }),
  );

  const addMessage = (msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: generateId() }]);
  };

  const addAssistantMessage = async (
    content: string,
    options?: ChatMessage["options"],
    step?: ChatStep,
  ) => {
    setIsAiThinking(true);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    addMessage({ role: "assistant", content, options, step });
    setIsAiThinking(false);
    if (step) setCurrentStep(step);
  };

  const handleOptionSelect = async (value: string, label: string) => {
    addMessage({ role: "user", content: label });

    switch (currentStep) {
      case "type": {
        const selectedType = gigTypeOptions.find((t) => t.value === value);
        setDraft((prev) => ({ ...prev, type: value }));
        await addAssistantMessage(
          `Отлично, ${selectedType?.emoji} ${selectedType?.label}! Теперь опишите задачу подробнее. Что именно нужно сделать? Можете написать своими словами или выбрать шаблон:`,
          [
            { value: "landing", label: "Создать лендинг" },
            { value: "app", label: "Разработать приложение" },
            { value: "design", label: "Сделать дизайн" },
            { value: "content", label: "Написать контент" },
            { value: "custom", label: "Опишу сам…" },
          ],
          "description",
        );
        break;
      }
      case "description": {
        if (value === "custom") {
          await addAssistantMessage(
            "Опишите задачу своими словами. Чем подробнее, тем лучше я смогу помочь:",
            undefined,
            "description",
          );
        } else {
          setDraft((prev) => ({ ...prev, title: label }));
          await addAssistantMessage(
            `Понял, "${label}". Расскажите подробнее: какой функционал нужен, есть ли референсы, особые требования?`,
            undefined,
            "description",
          );
        }
        break;
      }
      case "skills": {
        setDraft((prev) => ({ ...prev, requiredSkills: label }));
        await addAssistantMessage(
          "Теперь определим бюджет. Выберите диапазон или укажите свой:",
          budgetRanges.map((b) => ({ value: b.value, label: b.label })),
          "budget",
        );
        break;
      }
      case "budget": {
        if (value === "custom") {
          await addAssistantMessage(
            "Укажите ваш бюджет (например: 25000-40000 или просто 30000):",
            undefined,
            "budget",
          );
        } else {
          const range = budgetRanges.find((b) => b.value === value);
          if (range) {
            setDraft((prev) => ({
              ...prev,
              budgetMin: range.min,
              budgetMax: range.max,
            }));
          }
          await addAssistantMessage(
            "Отлично! Когда нужен результат?",
            timelineOptions.map((t) => ({ value: t.value, label: t.label })),
            "timeline",
          );
        }
        break;
      }
      case "timeline": {
        if (value === "custom") {
          await addAssistantMessage(
            "Укажите желаемые сроки (например: 5 дней, 3 недели):",
            undefined,
            "timeline",
          );
        } else {
          setDraft((prev) => ({ ...prev, estimatedDuration: value }));
          await showReview();
        }
        break;
      }
    }
  };

  const showReview = async () => {
    setCurrentStep("review");
    const typeLabel =
      gigTypeOptions.find((t) => t.value === draft.type)?.label || draft.type;
    const budgetStr =
      draft.budgetMin && draft.budgetMax
        ? `${draft.budgetMin.toLocaleString("ru-RU")} – ${draft.budgetMax.toLocaleString("ru-RU")} ₽`
        : "Не указан";

    await addAssistantMessage(
      `Отлично! Вот что получилось:\n\n` +
        `📋 **${draft.title || "Без названия"}**\n` +
        `📁 Тип: ${typeLabel}\n` +
        `💰 Бюджет: ${budgetStr}\n` +
        `⏱ Сроки: ${draft.estimatedDuration || "Не указаны"}\n\n` +
        `${draft.description ? `📝 ${draft.description}\n\n` : ""}` +
        `Всё верно? Можете отредактировать или создать задание:`,
      [
        { value: "create", label: "✅ Создать задание" },
        { value: "edit", label: "✏️ Редактировать" },
        { value: "ai-improve", label: "✨ Улучшить с AI" },
      ],
      "review",
    );
  };

  const handleFreeTextInput = async () => {
    const text = inputValue.trim();
    if (!text) return;

    addMessage({ role: "user", content: text });
    setInputValue("");

    switch (currentStep) {
      case "type":
      case "description": {
        setIsAiThinking(true);
        try {
          await generateWithAi({
            workspaceId: workspace?.id ?? "",
            message: text,
            currentDocument: {
              title: draft.title,
              description: draft.description,
              deliverables: draft.deliverables,
              requiredSkills: draft.requiredSkills,
            },
          });
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Не удалось сгенерировать",
          );
        } finally {
          setIsAiThinking(false);
        }

        if (currentStep === "type") {
          setDraft((prev) => ({ ...prev, description: text }));
          await addAssistantMessage(
            "Понял! Какие навыки и технологии потребуются исполнителю?",
            [
              { value: "react", label: "React / Next.js" },
              { value: "python", label: "Python" },
              { value: "design", label: "Figma / Дизайн" },
              { value: "content", label: "Копирайтинг" },
              { value: "custom", label: "Укажу сам…" },
            ],
            "skills",
          );
        } else {
          setDraft((prev) => ({
            ...prev,
            description: prev.description
              ? `${prev.description}\n${text}`
              : text,
          }));
          await addAssistantMessage(
            "Записал! Какие навыки и технологии потребуются?",
            [
              { value: "react", label: "React / Next.js" },
              { value: "python", label: "Python" },
              { value: "design", label: "Figma / Дизайн" },
              { value: "content", label: "Копирайтинг" },
              { value: "custom", label: "Укажу сам…" },
            ],
            "skills",
          );
        }
        break;
      }
      case "skills": {
        setDraft((prev) => ({ ...prev, requiredSkills: text }));
        await addAssistantMessage(
          "Отлично! Теперь определим бюджет:",
          budgetRanges.map((b) => ({ value: b.value, label: b.label })),
          "budget",
        );
        break;
      }
      case "budget": {
        const match = text.match(/(\d+)/g);
        if (match) {
          const nums = match.map(Number);
          setDraft((prev) => ({
            ...prev,
            budgetMin: nums[0],
            budgetMax: nums[1] || nums[0],
          }));
        }
        await addAssistantMessage(
          "Принято! Когда нужен результат?",
          timelineOptions.map((t) => ({ value: t.value, label: t.label })),
          "timeline",
        );
        break;
      }
      case "timeline": {
        setDraft((prev) => ({ ...prev, estimatedDuration: text }));
        await showReview();
        break;
      }
      case "review": {
        setIsAiThinking(true);
        generateWithAi({
          workspaceId: workspace?.id ?? "",
          message: text,
          currentDocument: {
            title: draft.title,
            description: draft.description,
            deliverables: draft.deliverables,
            requiredSkills: draft.requiredSkills,
            budgetRange:
              draft.budgetMin && draft.budgetMax
                ? `${draft.budgetMin}-${draft.budgetMax}`
                : undefined,
            timeline: draft.estimatedDuration,
          },
        });
        await new Promise((r) => setTimeout(r, 1500));
        setIsAiThinking(false);
        await showReview();
        break;
      }
    }
  };

  const handleReviewAction = async (action: string) => {
    addMessage({
      role: "user",
      content:
        action === "create"
          ? "Создать задание"
          : action === "edit"
            ? "Редактировать"
            : "Улучшить с AI",
    });

    if (action === "create") {
      form.setValue("title", draft.title);
      form.setValue("description", draft.description);
      form.setValue("type", draft.type as FormValues["type"]);
      form.setValue("deliverables", draft.deliverables);
      form.setValue("requiredSkills", draft.requiredSkills);
      form.setValue("budgetMin", draft.budgetMin?.toString() || "");
      form.setValue("budgetMax", draft.budgetMax?.toString() || "");
      form.setValue("estimatedDuration", draft.estimatedDuration);

      createGig({
        workspaceId: workspace?.id ?? "",
        title: draft.title || "Новое задание",
        description: draft.description || undefined,
        type: draft.type as FormValues["type"],
        budgetMin: draft.budgetMin,
        budgetMax: draft.budgetMax,
        budgetCurrency: "RUB",
        estimatedDuration: draft.estimatedDuration || undefined,
        deliverables: draft.deliverables || undefined,
        requiredSkills: draft.requiredSkills || undefined,
      });
    } else if (action === "edit") {
      form.setValue("title", draft.title);
      form.setValue("description", draft.description);
      form.setValue("type", draft.type as FormValues["type"]);
      form.setValue("deliverables", draft.deliverables);
      form.setValue("requiredSkills", draft.requiredSkills);
      form.setValue("budgetMin", draft.budgetMin?.toString() || "");
      form.setValue("budgetMax", draft.budgetMax?.toString() || "");
      form.setValue("estimatedDuration", draft.estimatedDuration);
      setShowForm(true);
    } else if (action === "ai-improve") {
      setIsAiThinking(true);
      generateWithAi({
        workspaceId: workspace?.id ?? "",
        message:
          "Улучши и структурируй описание задания, сделай его более профессиональным и понятным для исполнителя",
        currentDocument: {
          title: draft.title,
          description: draft.description,
          deliverables: draft.deliverables,
          requiredSkills: draft.requiredSkills,
          budgetRange:
            draft.budgetMin && draft.budgetMax
              ? `${draft.budgetMin}-${draft.budgetMax}`
              : undefined,
          timeline: draft.estimatedDuration,
        },
      });
      await new Promise((r) => setTimeout(r, 2000));
      setIsAiThinking(false);
      await addAssistantMessage(
        "Готово! Я улучшил описание. Посмотрите обновлённую версию:",
        undefined,
        "review",
      );
      await showReview();
    }
  };

  const onSubmit = (values: FormValues) => {
    const budgetMin = values.budgetMin
      ? Number.parseInt(values.budgetMin)
      : undefined;
    const budgetMax = values.budgetMax
      ? Number.parseInt(values.budgetMax)
      : undefined;

    createGig({
      workspaceId: workspace?.id ?? "",
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
    <div className="container mx-auto max-w-6xl py-6">
      <div className="mb-6">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к заданиям
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Panel */}
        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Помощник</CardTitle>
                <CardDescription>
                  Создание задания в режиме диалога
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex flex-col gap-2 max-w-[85%]",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.options.map((opt) => (
                          <Button
                            key={opt.value}
                            variant="outline"
                            size="sm"
                            className="h-auto py-2 px-3 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => {
                              if (msg.step === "review") {
                                handleReviewAction(opt.value);
                              } else {
                                handleOptionSelect(opt.value, opt.label);
                              }
                            }}
                            disabled={isAiThinking || isCreating}
                          >
                            {opt.emoji && (
                              <span className="mr-1.5">{opt.emoji}</span>
                            )}
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-4">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleFreeTextInput();
                  }
                }}
                placeholder="Напишите сообщение или выберите опцию выше…"
                className="min-h-[60px] resize-none text-sm"
                disabled={isAiThinking || isCreating}
              />
              <Button
                size="icon"
                className="h-[60px] w-[60px] shrink-0"
                onClick={handleFreeTextInput}
                disabled={!inputValue.trim() || isAiThinking || isCreating}
                aria-label="Отправить сообщение"
              >
                {isAiThinking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⌘/Ctrl + Enter для отправки
            </p>
          </div>
        </Card>

        {/* Preview / Form Panel */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Предпросмотр</CardTitle>
                    <CardDescription>
                      Задание формируется в реальном времени
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(!showForm)}
                  className="gap-2"
                >
                  {showForm ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {showForm ? "Скрыть форму" : "Редактировать"}
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {!showForm ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {draft.title || (
                        <span className="text-muted-foreground italic">
                          Название задания…
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {
                          gigTypeOptions.find((t) => t.value === draft.type)
                            ?.emoji
                        }{" "}
                        {gigTypeOptions.find((t) => t.value === draft.type)
                          ?.label || "Другое"}
                      </Badge>
                      {draft.estimatedDuration && (
                        <Badge variant="outline">
                          ⏱ {draft.estimatedDuration}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {draft.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Описание
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {draft.description}
                      </p>
                    </div>
                  )}

                  {draft.deliverables && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Что нужно сделать
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {draft.deliverables}
                      </p>
                    </div>
                  )}

                  {draft.requiredSkills && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Требуемые навыки
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.requiredSkills.split(/[,;]/).map((skill) => (
                          <Badge
                            key={skill.trim()}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(draft.budgetMin || draft.budgetMax) && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm font-medium">💰 Бюджет:</span>
                      <span className="text-sm tabular-nums">
                        {draft.budgetMin?.toLocaleString("ru-RU")}
                        {draft.budgetMax &&
                          draft.budgetMax !== draft.budgetMin && (
                            <> – {draft.budgetMax.toLocaleString("ru-RU")}</>
                          )}{" "}
                        ₽
                      </span>
                    </div>
                  )}

                  {!draft.title && !draft.description && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>
                        Начните диалог с AI помощником,
                        <br />и задание появится здесь
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название *</FormLabel>
                          <FormControl>
                            <Input placeholder="Название задания…" {...field} />
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
                          <FormLabel>Тип</FormLabel>
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
                              {gigTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.emoji} {opt.label}
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
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Описание проекта…"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requiredSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Навыки</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="React, TypeScript, Figma…"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Бюджет от</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
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
                            <FormLabel>Бюджет до</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="100000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Сроки</FormLabel>
                          <FormControl>
                            <Input placeholder="2 недели…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowForm(false)}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Создание…
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Создать
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Прогресс заполнения
                </span>
                <span className="font-medium tabular-nums">
                  {Math.round(
                    ([
                      draft.type !== "OTHER",
                      draft.title,
                      draft.description,
                      draft.requiredSkills,
                      draft.budgetMin,
                      draft.estimatedDuration,
                    ].filter(Boolean).length /
                      6) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      ([
                        draft.type !== "OTHER",
                        draft.title,
                        draft.description,
                        draft.requiredSkills,
                        draft.budgetMin,
                        draft.estimatedDuration,
                      ].filter(Boolean).length /
                        6) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                <span className={draft.type !== "OTHER" ? "text-primary" : ""}>
                  Тип
                </span>
                <span className={draft.title ? "text-primary" : ""}>
                  Название
                </span>
                <span className={draft.description ? "text-primary" : ""}>
                  Описание
                </span>
                <span className={draft.requiredSkills ? "text-primary" : ""}>
                  Навыки
                </span>
                <span className={draft.budgetMin ? "text-primary" : ""}>
                  Бюджет
                </span>
                <span className={draft.estimatedDuration ? "text-primary" : ""}>
                  Сроки
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
