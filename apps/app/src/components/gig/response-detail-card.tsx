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
  MetadataCard,
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

      {/* Screening Results */}
      {hasScreening && <ScreeningResultsCard screening={screening} />}

      {/* Interview Scoring Results */}
      {hasInterviewScoring && response.interviewScoring && (
        <InterviewScoringCard interviewScoring={response.interviewScoring} />
      )}

      {/* Parsed Profile Info */}
      {response.profileData && !response.profileData.error && (
        <ParsedProfileCard profileData={response.profileData} />
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs defaultValue="proposal" className="w-full">
          <CardHeader>
            <TabsList
              className={cn(
                "grid w-full h-auto gap-1 p-1",
                hasConversation
                  ? "grid-cols-2 sm:grid-cols-5"
                  : "grid-cols-2 sm:grid-cols-4",
              )}
            >
              <TabsTrigger
                value="proposal"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-action-manipulation"
              >
                Предложение
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-action-manipulation"
              >
                Портфолио
              </TabsTrigger>
              <TabsTrigger
                value="experience"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-action-manipulation"
              >
                Опыт
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-action-manipulation"
              >
                Контакты
              </TabsTrigger>
              {hasConversation && (
                <TabsTrigger
                  value="dialog"
                  className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-action-manipulation col-span-2 sm:col-span-1"
                >
                  Диалог
                </TabsTrigger>
              )}
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent
              value="proposal"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ProposalTab response={response} />
            </TabsContent>

            <TabsContent
              value="portfolio"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <PortfolioTab response={response} />
            </TabsContent>

            <TabsContent
              value="experience"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ExperienceTab response={response} />
            </TabsContent>

            <TabsContent
              value="contacts"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ContactsTab response={response} />
            </TabsContent>

            {hasConversation && response.conversation && (
              <TabsContent
                value="dialog"
                className="space-y-3 sm:space-y-4 mt-0"
              >
                <DialogTab conversation={response.conversation} />
              </TabsContent>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Metadata Card */}
      <MetadataCard response={response} />
    </div>
  );
}
