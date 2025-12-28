import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { InterviewLandingForm } from "./_components/interview-landing-form";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const data = await api.freelancePlatforms.getVacancyByToken({ token });
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
    const data = await api.freelancePlatforms.getVacancyByToken({ token });

    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {data.vacancy.title}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              AI-интервью для отбора кандидатов
            </p>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              О процессе интервью
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Вы будете общаться с AI-ассистентом, который задаст вам вопросы
                о вашем опыте и навыках.
              </p>
              <p>
                <strong>Примерное время:</strong> 10–15&nbsp;минут
              </p>
              <p>
                <strong>Формат:</strong> Текстовый чат в реальном времени
              </p>
              <p className="text-sm">
                После завершения интервью работодатель получит ваши ответы и
                свяжется с вами при положительном решении.
              </p>
            </div>
          </div>

          {data.vacancy.description && (
            <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Описание вакансии
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p className="whitespace-pre-wrap">
                  {data.vacancy.description}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Ваши данные
            </h2>
            <InterviewLandingForm
              token={token}
              vacancyId={data.vacancy.id}
              platformSource={data.vacancy.source}
            />
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Нажимая «Начать интервью», вы соглашаетесь на обработку ваших
              персональных данных
            </p>
          </div>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
