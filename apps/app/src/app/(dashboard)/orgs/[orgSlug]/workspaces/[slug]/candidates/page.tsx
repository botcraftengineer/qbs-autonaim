import { CandidatePipeline } from "~/components/candidates";
import { PageHeader } from "~/components/layout";

export default function CandidatesPage() {
  return (
    <div className="kanban-page flex flex-1 flex-col overflow-hidden">
      <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
        <PageHeader
          title="Кандидаты"
          description="База данных кандидатов и их профили"
          docsUrl="https://docs.hh.qbs.ru/candidates"
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CandidatePipeline />
          </div>
        </div>
      </div>
    </div>
  );
}
