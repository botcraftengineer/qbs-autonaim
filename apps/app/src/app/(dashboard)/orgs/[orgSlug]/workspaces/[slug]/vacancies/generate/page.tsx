import { VacancyCreatorContainer } from "~/components/vacancy-creator";

interface PageProps {
  params: Promise<{
    orgSlug: string;
    slug: string;
  }>;
}

export default async function VacancyGeneratePage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Создание вакансии с AI</h1>
        <p className="text-sm text-muted-foreground">
          Опишите требования в чате, и AI сформирует документ вакансии
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <VacancyCreatorContainer workspaceId={slug} />
      </div>
    </div>
  );
}
