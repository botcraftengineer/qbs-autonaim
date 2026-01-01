"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

import { GigForm, GigPreview, ProgressCard } from "./components";
import { type FormValues, formSchema, type GigDraft } from "./components/types";
import { WizardChat } from "./components/wizard-chat";
import type { WizardState } from "./components/wizard-types";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default function CreateGigPage({ params }: PageProps) {
  const router = useRouter();
  const { orgSlug, slug: workspaceSlug } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

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

  const handleWizardComplete = async (wizardState: WizardState) => {
    setIsGenerating(true);

    // Собираем данные из wizard в текстовое описание для AI
    const parts: string[] = [];

    if (wizardState.category) {
      parts.push(`Категория: ${wizardState.category.label}`);
    }
    if (wizardState.subtype) {
      parts.push(`Тип: ${wizardState.subtype.label}`);
    }
    if (wizardState.features.length > 0 && wizardState.subtype) {
      const featureLabels = wizardState.features
        .map(
          (fId) =>
            wizardState.subtype?.features.find((f) => f.id === fId)?.label,
        )
        .filter(Boolean);
      parts.push(`Функции: ${featureLabels.join(", ")}`);
    }
    if (wizardState.budget) {
      parts.push(`Бюджет: ${wizardState.budget.label}`);
    }
    if (wizardState.timeline) {
      parts.push(
        `Сроки: ${wizardState.timeline.label} (${wizardState.timeline.days})`,
      );
    }
    if (wizardState.customDetails) {
      parts.push(`Дополнительно: ${wizardState.customDetails}`);
    }

    const message = parts.join("\n");

    try {
      const result = await generateWithAi({
        workspaceId: workspace?.id ?? "",
        message,
        currentDocument: {},
        conversationHistory: [],
      });

      const doc = result.document;

      // Обновляем draft из ответа AI
      setDraft({
        title: doc.title || "",
        description: doc.description || "",
        type: wizardState.category?.id || "OTHER",
        deliverables: doc.deliverables || "",
        requiredSkills: doc.requiredSkills || "",
        budgetMin: wizardState.budget?.min,
        budgetMax: wizardState.budget?.max,
        budgetCurrency: "RUB",
        estimatedDuration: doc.timeline || wizardState.timeline?.days || "",
      });

      toast.success("ТЗ сгенерировано! Проверьте и создайте задание.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      setIsGenerating(false);
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
      budgetMin: v.budgetMin ? Number.parseInt(v.budgetMin) : undefined,
      budgetMax: v.budgetMax ? Number.parseInt(v.budgetMax) : undefined,
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
    form.setValue("budgetMin", draft.budgetMin?.toString() || "");
    form.setValue("budgetMax", draft.budgetMax?.toString() || "");
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
