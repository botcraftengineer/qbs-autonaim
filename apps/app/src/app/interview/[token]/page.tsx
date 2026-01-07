import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewLandingForm } from "~/components/interview-landing-form";
import { api } from "~/trpc/server";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const caller = await api();
    const data = await caller.freelancePlatforms.getVacancyByToken({ token });
    return {
      title: `Интервью: ${data.vacancy.title}`,
      description: "Пройдите AI-интервью для отбора на вакансию",
    };
  } catch {
    return {
      title: "Интервью",
      description: "Пройдите AI-интервью для отбора на вакансию",
    };
  }
}

export default async function InterviewLandingPage({ params }: PageProps) {
  const { token } = await params;

  try {
    const caller = await api();
    const data = await caller.freelancePlatforms.getVacancyByToken({ token });
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
              {data.vacancy.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Пройдите короткое AI-интервью за 10–15&nbsp;минут
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <InterviewLandingForm
              token={token}
              vacancyId={data.vacancy.id}
              platformSource={data.vacancy.source}
            />
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Нажимая «Начать», вы соглашаетесь на обработку персональных данных
          </p>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
