import { CandidatePipeline } from "~/components/candidates";
import { SiteHeader } from "~/components/layout";

export default function CandidatesPage() {
  return (
    <>
      <SiteHeader title="Кандидаты" />
      <div className="kanban-page flex flex-1 flex-col overflow-hidden">
        <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-4 md:px-6 lg:px-8">
              <p className="text-sm text-muted-foreground mb-4 md:mb-6">
                Управление процессом найма
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <CandidatePipeline />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
