import { ScrollArea } from "@qbs-autonaim/ui";
import { CandidateInfo } from "./candidate-info";
import { ResumePdfLink } from "./resume-pdf-link";
import { ScreeningInfo } from "./screening-info";
import { StatusInfo } from "./status-info";
import { TelegramInterviewScoring } from "./telegram-interview-scoring";
import { VacancyInfo } from "./vacancy-info";

interface ChatSidebarProps {
  candidateName: string | null;
  chatId: string;
  responseData?: {
    status?: string | null;
    createdAt?: Date | null;
    resumePdfFile?: {
      key: string;
      fileName: string;
    } | null;
    screening?: {
      score: number | null;
      detailedScore?: number | null;
      analysis?: string | null;
    } | null;
    telegramInterviewScoring?: {
      score: number | null;
      detailedScore: number | null;
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
    <div className="w-full lg:w-80 border-l flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          <CandidateInfo candidateName={candidateName} chatId={chatId} />

          {responseData?.resumePdfFile && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Резюме</h2>
              <ResumePdfLink fileKey={responseData.resumePdfFile.key} />
            </div>
          )}

          {responseData?.screening && (
            <div className="max-h-96">
              <ScreeningInfo
                score={responseData.screening.score}
                detailedScore={responseData.screening.detailedScore}
                analysis={responseData.screening.analysis}
              />
            </div>
          )}

          {responseData?.telegramInterviewScoring && (
            <div className="max-h-96">
              <TelegramInterviewScoring
                score={responseData.telegramInterviewScoring.score}
                detailedScore={
                  responseData.telegramInterviewScoring.detailedScore
                }
                analysis={responseData.telegramInterviewScoring.analysis}
              />
            </div>
          )}

          {responseData?.vacancy && (
            <VacancyInfo title={responseData.vacancy.title} />
          )}

          <StatusInfo
            status={responseData?.status}
            createdAt={responseData?.createdAt}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
