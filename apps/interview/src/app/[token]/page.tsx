"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { InterviewLandingForm } from "~/components/interview-landing-form";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{ token: string }>;
}

function InterviewLandingClient({ token }: { token: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    trpc.freelancePlatforms.getInterviewByToken.queryOptions({ token }),
  );

  const startInterviewMutation = useMutation(
    trpc.freelancePlatforms.startWebInterview.mutationOptions(),
  );

  if (isLoading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        {/* Background elements */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]"
          aria-hidden="true"
        />
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 animate-pulse">
          <div className="h-[400px] w-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,182,193,0.15)_0%,transparent_70%)] blur-3xl" />
        </div>
        <div className="pointer-events-none absolute left-1/4 top-20 animate-pulse delay-1000">
          <div className="h-[300px] w-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.15)_0%,transparent_70%)] blur-3xl" />
        </div>

        {/* Main loading content */}
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          {/* Animated logo */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30">
              <svg
                className="h-10 w-10 text-white animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-purple-400/20 animate-ping animation-delay-300" />
          </div>

          {/* Loading steps */}
          <div className="flex flex-col items-center gap-4 max-w-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce animation-delay-100" />
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce animation-delay-200" />
              </div>
              <span className="text-sm font-medium">
                Подготовка AI-интервью
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-violet-500 to-purple-600 rounded-full animate-pulse"
                  style={{
                    width: "60%",
                    animation: "shimmer 2s infinite linear",
                  }}
                />
              </div>
            </div>

            {/* Animated text */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground animate-fade-in">
                Загрузка персонализированных вопросов…
              </p>
              <p className="text-xs text-muted-foreground/70">
                Это займет всего несколько секунд
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animation-delay-100 { animation-delay: 0.1s; }
          .animation-delay-200 { animation-delay: 0.2s; }
          .animation-delay-300 { animation-delay: 0.3s; }
          .animate-fade-in {
            animation: fadeIn 2s ease-in-out infinite alternate;
          }
          @keyframes fadeIn {
            from { opacity: 0.7; }
            to { opacity: 1; }
          }
        `}</style>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Ссылка на интервью не найдена
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ссылка недействительна, истекла или вакансия закрыта
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Если вы считаете, что это ошибка, свяжитесь с работодателем
          </p>
        </div>
      </main>
    );
  }

  const subtitle =
    data.type === "vacancy"
      ? "Пройдите короткое AI-интервью за 10–15\u00A0минут"
      : "Пройдите короткое AI-интервью на задание за 10–15\u00A0минут";

  const handleSubmit = async (formData: {
    name: string;
    platformProfileUrl: string;
  }) => {
    const result = await startInterviewMutation.mutateAsync({
      token,
      freelancerInfo: formData,
    });
    return { interviewSessionId: result.sessionId };
  };

  const handleCheckDuplicate = async (
    vacancyId: string,
    platformProfileUrl: string,
  ) => {
    const result = await queryClient.fetchQuery(
      trpc.freelancePlatforms.checkDuplicateResponse.queryOptions({
        vacancyId,
        platformProfileUrl,
      }),
    );
    return { isDuplicate: result.isDuplicate };
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]"
        aria-hidden="true"
      />
      {/* Gradient blobs */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="h-[400px] w-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,182,193,0.3)_0%,transparent_70%)]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/4 top-20"
        aria-hidden="true"
      >
        <div className="h-[300px] w-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.3)_0%,transparent_70%)]" />
      </div>
      <div
        className="pointer-events-none absolute right-1/4 top-32"
        aria-hidden="true"
      >
        <div className="h-[250px] w-[250px] bg-[radial-gradient(ellipse_at_center,rgba(221,160,221,0.25)_0%,transparent_70%)]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/3 top-40"
        aria-hidden="true"
      >
        <div className="h-[200px] w-[200px] bg-[radial-gradient(ellipse_at_center,rgba(173,216,230,0.25)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {data.data.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <InterviewLandingForm
            token={token}
            entityId={data.data.id}
            entityType={data.type}
            platformSource={data.data.source}
            onSubmit={handleSubmit}
            onCheckDuplicate={
              data.type === "vacancy" ? handleCheckDuplicate : undefined
            }
          />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Нажимая «Начать», вы соглашаетесь на обработку персональных данных
        </p>
      </div>
    </main>
  );
}

export default function InterviewLandingPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  return <InterviewLandingClient token={unwrappedParams.token} />;
}
