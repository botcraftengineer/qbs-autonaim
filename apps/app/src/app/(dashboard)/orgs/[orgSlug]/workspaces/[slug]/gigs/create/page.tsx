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

import { ChatPanel, GigForm, GigPreview, ProgressCard } from "./components";
import {
  type ChatMessage,
  type FormValues,
  formSchema,
  type GigDraft,
  type GigType,
  generateId,
  typeKeywords,
} from "./components/types";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

const WELCOME = `Привет! 👋 Я помогу создать техническое задание для фрилансера.

Выберите, что вам нужно, или опишите своими словами:`;

const INITIAL_QUICK_REPLIES = [
  "Разработка сайта",
  "Дизайн логотипа",
  "Написать текст",
  "Другое",
];

export default function CreateGigPage({ params }: PageProps) {
  const router = useRouter();
  const { orgSlug, slug: workspaceSlug } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME,
      quickReplies: INITIAL_QUICK_REPLIES,
    },
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [isAiThinking, setIsAiThinking] = React.useState(false);
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

  const getHistory = () =>
    messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

  const handleSend = async (text?: string) => {
    const messageText = text ?? inputValue.trim();
    if (!messageText || isAiThinking) return;

    // Очищаем quick replies у предыдущих сообщений
    setMessages((p) => p.map((msg) => ({ ...msg, quickReplies: undefined })));

    setMessages((p) => [
      ...p,
      { id: generateId(), role: "user", content: messageText },
    ]);
    setInputValue("");
    setIsAiThinking(true);

    try {
      const result = await generateWithAi({
        workspaceId: workspace?.id ?? "",
        message: messageText,
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
        conversationHistory: getHistory(),
      });

      const doc = result.document;
      setDraft((p) => ({
        ...p,
        title: doc.title || p.title,
        description: doc.description || p.description,
        deliverables: doc.deliverables || p.deliverables,
        requiredSkills: doc.requiredSkills || p.requiredSkills,
        estimatedDuration: doc.timeline || p.estimatedDuration,
      }));

      if (doc.budgetRange) {
        const m = doc.budgetRange.match(/(\d+)[-–](\d+)/);
        if (m?.[1] && m?.[2]) {
          const min = Number.parseInt(m[1]);
          const max = Number.parseInt(m[2]);
          setDraft((p) => ({ ...p, budgetMin: min, budgetMax: max }));
        }
      }

      const fullText = `${doc.title} ${doc.description}`.toLowerCase();
      for (const [type, kws] of Object.entries(typeKeywords)) {
        if (kws.some((kw) => fullText.includes(kw))) {
          setDraft((p) => ({ ...p, type: type as GigType }));
          break;
        }
      }

      const missing: string[] = [];
      if (!doc.title) missing.push("название");
      if (!doc.description) missing.push("описание");
      if (!doc.deliverables) missing.push("что сделать");
      if (!doc.requiredSkills) missing.push("навыки");
      if (!doc.budgetRange) missing.push("бюджет");
      if (!doc.timeline) missing.push("сроки");

      let reply: string;
      if (missing.length === 0)
        reply =
          "Отлично! ТЗ готово. Можете отредактировать справа или создать задание.";
      else if (missing.length <= 2)
        reply = `Хорошо! Осталось уточнить: ${missing.join(", ")}.`;
      else
        reply = `Понял! Расскажите ещё:\n• ${missing.slice(0, 3).join("\n• ")}`;

      setMessages((p) => [
        ...p,
        {
          id: generateId(),
          role: "assistant",
          content: reply,
          quickReplies: result.quickReplies,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка генерации");
      setMessages((p) => [
        ...p,
        {
          id: generateId(),
          role: "assistant",
          content: "Произошла ошибка. Попробуйте ещё раз.",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
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
        <ChatPanel
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={() => handleSend()}
          onQuickReply={handleQuickReply}
          isThinking={isAiThinking}
          isDisabled={isAiThinking || isCreating}
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
