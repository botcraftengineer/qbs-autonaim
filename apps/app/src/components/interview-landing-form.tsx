"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { paths } from "@qbs-autonaim/config";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

const platformProfileUrlSchema = z
  .string()
  .min(1, "URL профиля обязателен")
  .regex(
    /(kwork\.ru|fl\.ru|weblancer\.net|upwork\.com|freelancer\.com)/i,
    "Некорректный URL профиля платформы",
  );

const freelancerInfoSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(500, "Имя слишком длинное"),
  platformProfileUrl: platformProfileUrlSchema,
});

type FreelancerInfo = z.infer<typeof freelancerInfoSchema>;

interface InterviewLandingFormProps {
  token: string;
  entityId: string;
  entityType: "vacancy" | "gig";
  platformSource: string;
}

const getPlatformPlaceholder = (source: string): string => {
  switch (source.toLowerCase()) {
    case "kwork":
      return "https://kwork.ru/user/username…";
    case "fl":
      return "https://fl.ru/users/username/…";
    case "weblancer":
      return "https://weblancer.net/users/username/…";
    case "upwork":
      return "https://upwork.com/freelancers/username…";
    default:
      return "https://kwork.ru/user/username…";
  }
};

export function InterviewLandingForm({
  token,
  entityId,
  entityType,
  platformSource,
}: InterviewLandingFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<FreelancerInfo>({
    resolver: zodResolver(freelancerInfoSchema),
    mode: "onSubmit",
  });

  const platformProfileUrl = watch("platformProfileUrl");

  // Проверка дубликатов только для вакансий
  const checkDuplicateQuery = useQuery(
    trpc.freelancePlatforms.checkDuplicateResponse.queryOptions(
      {
        vacancyId: entityId,
        platformProfileUrl: platformProfileUrl || "",
      },
      {
        enabled: false,
      },
    ),
  );

  const startInterviewMutation = useMutation(
    trpc.freelancePlatforms.startWebInterview.mutationOptions({
      onSuccess: (data) => {
        router.push(
          `${paths.interview(token)}/chat?responseId=${data.conversationId}`,
        );
      },
      onError: (error: { message: string }) => {
        setIsSubmitting(false);
        const duplicateMessage =
          entityType === "vacancy"
            ? "Вы уже откликнулись на эту вакансию"
            : "Вы уже откликнулись на это задание";

        if (error.message.includes("откликнулись")) {
          setError("platformProfileUrl", {
            type: "manual",
            message: duplicateMessage,
          });
        } else {
          setError("root", {
            type: "manual",
            message: error.message || "Произошла ошибка. Попробуйте снова.",
          });
        }
      },
    }),
  );

  const onSubmit = async (data: FreelancerInfo) => {
    setIsSubmitting(true);

    const trimmedData = {
      name: data.name.trim(),
      platformProfileUrl: data.platformProfileUrl.trim(),
    };

    // Проверка дубликатов только для вакансий (на бэкенде тоже проверяется)
    if (entityType === "vacancy") {
      const duplicateCheck = await checkDuplicateQuery.refetch();
      if (duplicateCheck.data?.isDuplicate) {
        setError("platformProfileUrl", {
          type: "manual",
          message: "Вы уже откликнулись на эту вакансию",
        });
        setIsSubmitting(false);
        return;
      }
    }

    startInterviewMutation.mutate({
      token,
      freelancerInfo: trimmedData,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {errors.root.message}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Ваше имя
        </label>
        <input
          {...register("name")}
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Иван Иванов…"
          disabled={isSubmitting}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
        />
        {errors.name && (
          <p
            id="name-error"
            className="text-sm text-red-600"
            aria-live="polite"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="platformProfileUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Ссылка на профиль
        </label>
        <input
          {...register("platformProfileUrl")}
          id="platformProfileUrl"
          type="url"
          autoComplete="url"
          inputMode="url"
          spellCheck={false}
          placeholder={getPlatformPlaceholder(platformSource)}
          disabled={isSubmitting}
          aria-invalid={errors.platformProfileUrl ? "true" : "false"}
          aria-describedby={
            errors.platformProfileUrl
              ? "platformProfileUrl-error"
              : "platformProfileUrl-help"
          }
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
        />
        {!errors.platformProfileUrl && (
          <p id="platformProfileUrl-help" className="text-xs text-gray-500">
            Ваш профиль на фриланс-платформе
          </p>
        )}
        {errors.platformProfileUrl && (
          <p
            id="platformProfileUrl-error"
            className="text-sm text-red-600"
            aria-live="polite"
          >
            {errors.platformProfileUrl.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ touchAction: "manipulation" }}
      >
        {isSubmitting && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? "Загрузка…" : "Начать интервью"}
      </button>
    </form>
  );
}
