"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

import { GigForm, GigPreview, ProgressCard } from "./components";
import { type FormValues, formSchema, type GigDraft } from "./components/types";
import { WizardChat } from "./components/wizard-chat";
import type { WizardState } from "./components/wizard-types";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Schema for validating AI response document
const aiDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),
  timeline: z.union([z.string(), z.number()]).optional(),
});

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default function CreateGigPage({ params }: PageProps) {
  const router = useRouter();
  const { orgSlug, slug: workspaceSlug } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const isMountedRef = React.useRef(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [quickReplies, setQuickReplies] = React.useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = React.useState<
    ConversationMessage[]
  >([]);
  const [wizardState, setWizardState] = React.useState<WizardState | null>(
    null,
  );

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      budgetMin: undefined,
      budgetMax: undefined,
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
        queryClient.invalidateQueries({ queryKey: trpc.gig.list.queryKey() });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (e) => toast.error(e.message || "Не удалось создать задание"),
    }),
  );

  const { mutateAsync: generateWithAi } = useMutation(
    trpc.gig.chatGenerate.mutationOptions(),
  );

  const handleWizardComplete = async (wizardStateParam: WizardState) => {
    setIsGenerating(true);
    setWizardState(wizardStateParam);

    // Собираем данные из wizard в текстовое описание для AI
    const parts: string[] = [];

    if (wizardStateParam.category) {
      parts.push(`Категория: ${wizardStateParam.category.label}`);
    }
    if (wizardStateParam.subtype) {
      parts.push(`Тип: ${wizardStateParam.subtype.label}`);
    }
    if (wizardStateParam.features.length > 0 && wizardStateParam.subtype) {
      const featureLabels = wizardStateParam.features
        .map(
          (fId) =>
            wizardStateParam.subtype?.features.find((f) => f.id === fId)?.label,
        )
        .filter(Boolean);
      parts.push(`Функции: ${featureLabels.join(", ")}`);
    }
    if (wizardStateParam.budget) {
      parts.push(`Бюджет: ${wizardStateParam.budget.label}`);
    }
    if (wizardStateParam.timeline) {
      parts.push(
        `Сроки: ${wizardStateParam.timeline.label} (${wizardStateParam.timeline.days})`,
      );
    }
    if (wizardStateParam.stack) {
      parts.push(`Стек: ${wizardStateParam.stack.label}`);
    }
    if (wizardStateParam.customDetails) {
      parts.push(`Дополнительно: ${wizardStateParam.customDetails}`);
    }

    const message = parts.join("\n");

    try {
      const result = await generateWithAi({
        workspaceId: workspace?.id ?? "",
        message,
        currentDocument: {},
        conversationHistory: [],
      });

      console.log("[gig.chatGenerate] result:", result);

      if (!isMountedRef.current) return;

      const doc = result.document;
      console.log("[gig.chatGenerate] doc:", doc);

      // Сохраняем quick replies
      setQuickReplies(result.quickReplies || []);

      // Validate AI response shape
      const parsed = aiDocumentSchema.safeParse(doc);

      if (!parsed.success) {
        console.error("AI response validation failed:", parsed.error);
        // Use safe defaults from wizard state
        setDraft({
          title: "",
          description: "",
          type: wizardStateParam.category?.id || "OTHER",
          deliverables: "",
          requiredSkills: "",
          budgetMin: wizardStateParam.budget?.min,
          budgetMax: wizardStateParam.budget?.max,
          budgetCurrency: "RUB",
          estimatedDuration: wizardStateParam.timeline?.days
            ? String(wizardStateParam.timeline.days)
            : "",
        });
      } else {
        const validDoc = parsed.data;
        // Нормализуем estimatedDuration к строке: приоритет AI-ответу, затем wizard
        const rawDuration =
          validDoc.timeline ?? wizardStateParam.timeline?.days;
        const estimatedDuration: string =
          rawDuration != null ? String(rawDuration) : "";

        setDraft({
          title: validDoc.title || "",
          description: validDoc.description || "",
          type: wizardStateParam.category?.id || "OTHER",
          deliverables: validDoc.deliverables || "",
          requiredSkills: validDoc.requiredSkills || "",
          budgetMin: wizardStateParam.budget?.min,
          budgetMax: wizardStateParam.budget?.max,
          budgetCurrency: "RUB",
          estimatedDuration,
        });
      }

      toast.success("ТЗ сгенерировано! Проверьте и создайте задание.");
    } catch (err) {
      if (!isMountedRef.current) return;
      toast.error(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleChatMessage = async (
    message: string,
    history: ConversationMessage[],
  ) => {
    if (!workspace?.id) return;

    setIsGenerating(true);
    setConversationHistory(history);

    try {
      const result = await generateWithAi({
        workspaceId: workspace.id,
        message,
        currentDocument: {
          title: draft.title,
          description: draft.description,
          deliverables: draft.deliverables,
          requiredSkills: draft.requiredSkills,
          budgetRange:
            draft.budgetMin && draft.budgetMax
              ? `${draft.budgetMin}-${draft.budgetMax} ${draft.budgetCurrency}`
              : undefined,
          timeline: draft.estimatedDuration,
        },
        conversationHistory: history.slice(-10), // Последние 10 сообщений
      });

      if (!isMountedRef.current) return;

      const doc = result.document;
      setQuickReplies(result.quickReplies || []);

      // Добавляем ответ ассистента в историю
      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Обновил ТЗ по вашему запросу." },
      ]);

      // Обновляем draft
      const parsed = aiDocumentSchema.safeParse(doc);
      if (parsed.success) {
        const validDoc = parsed.data;
        const rawDuration = validDoc.timeline ?? wizardState?.timeline?.days;
        const estimatedDuration: string =
          rawDuration != null ? String(rawDuration) : "";

        setDraft((prev) => ({
          ...prev,
          title: validDoc.title || prev.title,
          description: validDoc.description || prev.description,
          deliverables: validDoc.deliverables || prev.deliverables,
          requiredSkills: validDoc.requiredSkills || prev.requiredSkills,
          estimatedDuration: estimatedDuration || prev.estimatedDuration,
        }));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      toast.error(err instanceof Error ? err.message : "Ошибка обновления");
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleCreate = () => {
    if (!draft.title) {
      toast.error("Укажите название задания");
      return;
    }
    createGig({
      workspaceId: workspace?.id ?? "",
      title: draft.title,
      description: draft.description || undefined,
      type: draft.type,
      budgetMin: draft.budgetMin,
      budgetMax: draft.budgetMax,
      budgetCurrency: "RUB",
      estimatedDuration: draft.estimatedDuration || undefined,
      deliverables: draft.deliverables || undefined,
      requiredSkills: draft.requiredSkills || undefined,
    });
  };

  const onSubmit = (v: FormValues) => {
    createGig({
      workspaceId: workspace?.id ?? "",
      title: v.title,
      description: v.description || undefined,
      type: v.type,
      budgetMin: v.budgetMin,
      budgetMax: v.budgetMax,
      budgetCurrency: v.budgetCurrency,
      deadline: v.deadline ? new Date(v.deadline).toISOString() : undefined,
      estimatedDuration: v.estimatedDuration || undefined,
      deliverables: v.deliverables || undefined,
      requiredSkills: v.requiredSkills || undefined,
    });
  };

  const syncForm = () => {
    form.setValue("title", draft.title);
    form.setValue("description", draft.description);
    form.setValue("type", draft.type);
    form.setValue("deliverables", draft.deliverables);
    form.setValue("requiredSkills", draft.requiredSkills);
    form.setValue("budgetMin", draft.budgetMin);
    form.setValue("budgetMax", draft.budgetMax);
    form.setValue("estimatedDuration", draft.estimatedDuration);
    setShowForm((prev) => !prev);
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
        <WizardChat
          onComplete={handleWizardComplete}
          isGenerating={isGenerating}
          onChatMessage={handleChatMessage}
          quickReplies={quickReplies}
        />

        <div className="space-y-6">
          <GigPreview
            draft={draft}
            showForm={showForm}
            isCreating={isCreating}
            onEdit={syncForm}
            onCreate={handleCreate}
          >
            <GigForm
              form={form}
              onSubmit={onSubmit}
              onCancel={() => setShowForm(false)}
              isCreating={isCreating}
            />
          </GigPreview>

          <ProgressCard draft={draft} />
        </div>
      </div>
    </div>
  );
}
