"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  email: z.string().email("Некорректный email"),
  platformProfileUrl: platformProfileUrlSchema,
  phone: z.string().max(50).optional().or(z.literal("")),
  telegram: z.string().max(100).optional().or(z.literal("")),
});

type FreelancerInfo = z.infer<typeof freelancerInfoSchema>;

interface InterviewLandingFormProps {
  token: string;
  vacancyId: string;
  platformSource: string;
}

const getPlatformPlaceholder = (source: string): string => {
  switch (source.toLowerCase()) {
    case "kwork":
      return "https://kwork.ru/user/username";
    case "fl":
      return "https://fl.ru/users/username/";
    case "weblancer":
      return "https://weblancer.net/users/username/";
    case "upwork":
      return "https://upwork.com/freelancers/username";
    default:
      return "https://kwork.ru/user/username";
  }
};

export function InterviewLandingForm({
  token,
  vacancyId,
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

  const checkDuplicateMutation =
    trpc.freelancePlatforms.checkDuplicateResponse.useQuery(
      {
        vacancyId,
        platformProfileUrl: platformProfileUrl || "",
      },
      {
        enabled: false,
      },
    );

  const startInterviewMutation =
    trpc.freelancePlatforms.startInterview.useMutation({
      onSuccess: (data: { responseId: string; vacancyId: string }) => {
        router.push(`/interview/${token}/chat?responseId=${data.responseId}`);
      },
      onError: (error: { message: string }) => {
        setIsSubmitting(false);
        if (error.message.includes("откликнулись")) {
          setError("platformProfileUrl", {
            type: "manual",
            message: "Вы уже откликнулись на эту вакансию",
          });
        } else {
          setError("root", {
            type: "manual",
            message: error.message || "Произошла ошибка. Попробуйте снова.",
          });
        }
      },
    });

  const onSubmit = async (data: FreelancerInfo) => {
    setIsSubmitting(true);

    // Проверяем дубликаты
    const duplicateCheck = await checkDuplicateMutation.refetch();
    if (duplicateCheck.data?.isDuplicate) {
      setError("platformProfileUrl", {
        type: "manual",
        message: "Вы уже откликнулись на эту вакансию",
      });
      setIsSubmitting(false);
      return;
    }

    // Trim значения
    const trimmedData = {
      name: data.name.trim(),
      email: data.email.trim(),
      platformProfileUrl: data.platformProfileUrl.trim(),
      phone: data.phone?.trim(),
      telegram: data.telegram?.trim(),
    };

    startInterviewMutation.mutate({
      token,
      freelancerInfo: trimmedData,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          {errors.root.message}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Имя <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          id="name"
          type="text"
          autoComplete="name"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          disabled={isSubmitting}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          disabled={isSubmitting}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="platformProfileUrl"
          className="block text-sm font-medium text-gray-700"
        >
          URL профиля на платформе <span className="text-red-500">*</span>
        </label>
        <input
          {...register("platformProfileUrl")}
          id="platformProfileUrl"
          type="url"
          autoComplete="url"
          inputMode="url"
          spellCheck={false}
          placeholder={getPlatformPlaceholder(platformSource)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          disabled={isSubmitting}
          aria-invalid={errors.platformProfileUrl ? "true" : "false"}
          aria-describedby={
            errors.platformProfileUrl
              ? "platformProfileUrl-error"
              : "platformProfileUrl-help"
          }
        />
        {!errors.platformProfileUrl && (
          <p
            id="platformProfileUrl-help"
            className="mt-1 text-sm text-gray-500"
          >
            Укажите ссылку на ваш профиль на фриланс-платформе
          </p>
        )}
        {errors.platformProfileUrl && (
          <p
            id="platformProfileUrl-error"
            className="mt-1 text-sm text-red-600"
          >
            {errors.platformProfileUrl.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Телефон
        </label>
        <input
          {...register("phone")}
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+7 (999) 123-45-67"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          disabled={isSubmitting}
          aria-invalid={errors.phone ? "true" : "false"}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-600">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="telegram"
          className="block text-sm font-medium text-gray-700"
        >
          Telegram username
        </label>
        <input
          {...register("telegram")}
          id="telegram"
          type="text"
          autoComplete="username"
          spellCheck={false}
          placeholder="@username"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          disabled={isSubmitting}
          aria-invalid={errors.telegram ? "true" : "false"}
          aria-describedby={errors.telegram ? "telegram-error" : undefined}
        />
        {errors.telegram && (
          <p id="telegram-error" className="mt-1 text-sm text-red-600">
            {errors.telegram.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
        style={{ touchAction: "manipulation" }}
      >
        {isSubmitting ? (
          <>
            <svg
              className="mr-2 h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Начинаем интервью…
          </>
        ) : (
          "Начать интервью"
        )}
      </button>
    </form>
  );
}
