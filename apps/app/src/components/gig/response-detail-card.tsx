"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Card,
  CardContent,
  CardHeader,
  cn,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import {
  ContactsTab,
  DialogTab,
  ExperienceTab,
  InterviewScoringCard,
  ParsedProfileCard,
  PortfolioTab,
  ProposalTab,
  ResponseHeaderCard,
  ScreeningResultsCard,
} from "~/components/response-detail";

type GigResponseDetail = RouterOutputs["gig"]["responses"]["get"];

interface ResponseDetailCardProps {
  response: GigResponseDetail & {
    interviewScoring?: {
      score: number;
      detailedScore?: number;
      analysis: string | null;
    } | null;
    conversation?: {
      id: string;
      status: string;
      messages: Array<{
        id: string;
        sender: string;
        content: string;
        contentType: string;
        voiceTranscription: string | null;
        createdAt: Date;
      }>;
    } | null;
  };
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
  const screening =
    (
      response.interviewSession as {
        scoring?: {
          score: number;
          detailedScore: number;
          analysis: string | null;
          priceAnalysis?: string | null;
          deliveryAnalysis?: string | null;
        } | null;
      } | null
    )?.scoring ?? null;
  const hasScreening = !!screening;
  const hasInterviewScoring = !!response.interviewScoring;
  const hasConversation =
    !!response.conversation && response.conversation.messages.length > 0;

  // Определяем, какие табы показывать
  const hasProposal = !!(
    response.proposedPrice ||
    response.proposedDeliveryDays ||
    response.coverLetter
  );
  const hasPortfolio = !!(
    response.portfolioLinks?.length ||
    response.portfolioFileId
  );
  const hasExperience = !!(
    response.experience ||
    response.skills?.length ||
    response.profileData
  );
  const hasContacts = !!(
    response.candidateEmail ||
    response.candidatePhone ||
    response.candidateTelegram
  );

  // Определяем дефолтный таб
  const getDefaultTab = () => {
    if (hasConversation) return "dialog";
    if (hasScreening || hasInterviewScoring) return "analysis";
    if (hasProposal) return "proposal";
    if (hasExperience) return "experience";
    if (hasPortfolio) return "portfolio";
    if (hasContacts) return "contacts";
    return "proposal";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <ResponseHeaderCard
        response={response}
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
      <Card>
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <CardHeader className="pb-3">
            <TabsList
              className={cn(
                "grid w-full h-auto gap-1 p-1",
                hasConversation
                  ? "grid-cols-3 sm:grid-cols-6"
                  : "grid-cols-2 sm:grid-cols-5",
              )}
            >
              {(hasScreening || hasInterviewScoring) && (
                <TabsTrigger
                  value="analysis"
                  className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
                >
                  Анализ
                </TabsTrigger>
              )}
              {hasConversation && (
                <TabsTrigger
                  value="dialog"
                  className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
                >
                  Диалог
                </TabsTrigger>
              )}
              <TabsTrigger
                value="proposal"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Предложение
              </TabsTrigger>
              <TabsTrigger
                value="experience"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Опыт
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Портфолио
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Контакты
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* Analysis Tab */}
            {(hasScreening || hasInterviewScoring) && (
              <TabsContent
                value="analysis"
                className="space-y-3 sm:space-y-4 mt-0"
              >
                {hasScreening && <ScreeningResultsCard screening={screening} />}
                {hasInterviewScoring && response.interviewScoring && (
                  <InterviewScoringCard
                    interviewScoring={response.interviewScoring}
                  />
                )}
              </TabsContent>
            )}

            {/* Dialog Tab */}
            {hasConversation && response.conversation && (
              <TabsContent
                value="dialog"
                className="space-y-3 sm:space-y-4 mt-0"
              >
                <DialogTab conversation={response.conversation} />
              </TabsContent>
            )}

            {/* Proposal Tab */}
            <TabsContent
              value="proposal"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ProposalTab response={response} />
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent
              value="experience"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ExperienceTab response={response} />
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent
              value="portfolio"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <PortfolioTab response={response} />
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent
              value="contacts"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ContactsTab response={response} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
