"use client";

import { Button } from "@qbs-autonaim/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader, SiteHeader } from "~/components/layout";
import { VacancyForm } from "~/components/vacancies/vacancy-form";
import { useWorkspaceParams } from "~/hooks/use-workspace-params";

export default function CreateVacancyPage() {
  const { orgSlug, slug: workspaceSlug } = useWorkspaceParams();
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Вакансия успешно создана");
    router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`);
  };

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Создание вакансии"
          description="Создайте новую вакансию для фриланс-платформы"
          docsUrl="https://docs.hh.qbs.ru/vacancies/create"
        >
          <Button variant="outline" asChild>
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}
              aria-label="Вернуться к списку вакансий"
            >
              <IconArrowLeft className="size-4" aria-hidden="true" />
              Назад к списку
            </Link>
          </Button>
        </PageHeader>

        <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <VacancyForm onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </>
  );
}
