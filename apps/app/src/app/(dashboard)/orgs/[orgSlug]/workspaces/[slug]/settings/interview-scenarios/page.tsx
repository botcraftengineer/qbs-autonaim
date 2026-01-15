import { InterviewScenariosManagement } from "~/components/interview-scenarios/interview-scenarios-management";

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default async function InterviewScenariosPage({ params }: PageProps) {
  const { orgSlug, slug: workspaceSlug } = await params;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Сценарии интервью
        </h1>
        <p className="text-muted-foreground mt-1">
          Создавайте и управляйте сценариями проведения интервью для ваших заданий
        </p>
      </div>

      <InterviewScenariosManagement
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}