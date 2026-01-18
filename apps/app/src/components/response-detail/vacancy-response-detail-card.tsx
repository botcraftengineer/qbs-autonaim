"use client";

import { ParsedProfileCard, ResponseHeaderCard } from "~/components/response-detail";
import {
  useVacancyResponseFlags,
  type ResponseDetail,
} from "./hooks/use-vacancy-response-flags";
import { VacancyResponseTabs } from "./vacancy-response-tabs";

interface ResponseDetailCardProps {
  response: ResponseDetail;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

export function ResponseDetailCard({
  response,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: ResponseDetailCardProps) {
  const {
    hasScreening,
    hasInterviewScoring,
    hasConversation,
    screening,
    conversation,
    getDefaultTab,
  } = useVacancyResponseFlags(response);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <ResponseHeaderCard
        response={{
          ...response,
          conversation,
        }}
        onAccept={onAccept}
        onReject={onReject}
        onMessage={onMessage}
        onEvaluate={onEvaluate}
        isProcessing={isProcessing}
        isPolling={isPolling}
      />

      {/* Parsed Profile Info */}
      {response.profileData && !response.profileData.error && (
        <ParsedProfileCard profileData={response.profileData} />
      )}

      {/* Main Content Tabs */}
      <VacancyResponseTabs
        response={response}
        defaultTab={getDefaultTab()}
        hasScreening={hasScreening}
        hasInterviewScoring={hasInterviewScoring}
        hasConversation={hasConversation}
        screening={screening}
        conversation={conversation}
      />
    </div>
  );
}
