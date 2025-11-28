import { CandidateInfo } from "./candidate-info";
import { ScreeningInfo } from "./screening-info";
import { StatusInfo } from "./status-info";
import { VacancyInfo } from "./vacancy-info";

interface ChatSidebarProps {
  candidateName: string | null;
  chatId: string;
  responseData?: {
    about?: string | null;
    status?: string | null;
    createdAt?: Date | null;
    screening?: {
      score: number | null;
      detailedScore?: number | null;
      analysis?: string | null;
    } | null;
    vacancy?: {
      title: string;
      description?: string | null;
    } | null;
  } | null;
}

export function ChatSidebar({
  candidateName,
  chatId,
  responseData,
}: ChatSidebarProps) {
  return (
    <div className="w-80 border-l overflow-y-auto">
      <div className="p-6 space-y-6">
        <CandidateInfo
          candidateName={candidateName}
          chatId={chatId}
          about={responseData?.about}
        />

        {responseData?.screening && (
          <ScreeningInfo
            score={responseData.screening.score}
            detailedScore={responseData.screening.detailedScore}
            analysis={responseData.screening.analysis}
          />
        )}

        {responseData?.vacancy && (
          <VacancyInfo
            title={responseData.vacancy.title}
            description={responseData.vacancy.description}
          />
        )}

        <StatusInfo
          status={responseData?.status}
          createdAt={responseData?.createdAt}
        />
      </div>
    </div>
  );
}
