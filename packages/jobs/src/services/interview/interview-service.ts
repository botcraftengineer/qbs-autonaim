import { AgentFactory, InterviewOrchestrator } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { chatSession } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { stripHtml } from "string-strip-html";
import type {
  InterviewAnalysis,
  InterviewScoring,
} from "../../schemas/interview";
import { createLogger, INTERVIEW } from "../base";

const logger = createLogger("Interview");

// ==================== TYPES ====================

/** Question and answer pair from interview */
interface QuestionAnswer {
  question: string;
  answer: string;
}

/** Typed metadata structure for chatSession */
interface ChatSessionMetadata {
  questionAnswers?: QuestionAnswer[];
}

/** Extended interview analysis with escalation support */
interface ExtendedInterviewAnalysis extends InterviewAnalysis {
  shouldEscalate?: boolean;
  escalationReason?: string;
  waitingForCandidateResponse?: boolean;
  isSimpleAcknowledgment?: boolean;
}

interface InterviewContext {
  chatSessionId: string;
  candidateName: string | null;
  vacancyTitle: string | null;
  vacancyDescription: string | null;
  questionNumber: number;
  responseId: string | null;
  gigResponseId: string | null;
  resumeLanguage?: string | null;
  conversationHistory?: Array<{
    sender: "user" | "assistant";
    content: string;
    contentType?: "text" | "voice";
  }>;
  // Настройки компании
  companySettings?: {
    botName?: string;
    botRole?: string;
    name?: string;
    description?: string;
  };
  // Настройки вакансии
  customBotInstructions?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
  // Медиафайлы для показа кандидату
  interviewMediaFiles?: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    url: string;
  }>;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Safely converts metadata to typed object
 */
function parseMetadata(
  metadata: Record<string, unknown> | null,
): ChatSessionMetadata {
  if (!metadata) return {};

  return metadata as ChatSessionMetadata;
}

/**
 * Создает AI модель для агентов
 */
function createAgentModel() {
  return getAIModel();
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Analyzes candidate's answer and generates next question
 */
export async function analyzeAndGenerateNextQuestion(
  context: InterviewContext,
): Promise<ExtendedInterviewAnalysis> {
  const { questionNumber, candidateName, vacancyTitle, vacancyDescription } =
    context;

  // Валидация входных данных
  if (!Number.isFinite(questionNumber) || questionNumber < 0) {
    logger.error("Invalid questionNumber in analyzeAndGenerateNextQuestion", {
      chatSessionId: context.chatSessionId,
      questionNumber,
      type: typeof questionNumber,
    });
    throw new Error("questionNumber must be a non-negative number");
  }

  // Создаем оркестратор
  const model = createAgentModel();
  const orchestrator = new InterviewOrchestrator({ model });

  // Формируем контекст для агентов (конвертируем роли для совместимости с AI)
  const agentContext = {
    candidateId: context.chatSessionId,
    conversationId: context.chatSessionId,
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: (context.conversationHistory || []).map((msg) => ({
      sender:
        msg.sender === "user" ? "CANDIDATE" : ("BOT" as "CANDIDATE" | "BOT"),
      content: msg.content,
      contentType: msg.contentType
        ? ((msg.contentType === "text" ? "TEXT" : "VOICE") as "TEXT" | "VOICE")
        : undefined,
    })),
    companySettings: context.companySettings,
    customBotInstructions: context.customBotInstructions,
    customOrganizationalQuestions: context.customOrganizationalQuestions,
    customInterviewQuestions: context.customInterviewQuestions,
  };

  // Выполняем оркестратор
  const result = await orchestrator.execute(
    {
      questionNumber,
      customOrganizationalQuestions: context.customOrganizationalQuestions,
      customInterviewQuestions: context.customInterviewQuestions,
      resumeLanguage: context.resumeLanguage || "ru",
    },
    agentContext,
  );

  logger.info("Interview orchestrator trace", {
    chatSessionId: context.chatSessionId,
    trace: result.agentTrace.map(
      (t: { agent: string; decision: string; timestamp: Date }) => ({
        agent: t.agent,
        decision: t.decision,
      }),
    ),
  });

  // Проверка эскалации
  if (result.shouldEscalate) {
    logger.warn("Interview escalation triggered", {
      chatSessionId: context.chatSessionId,
      reason: result.escalationReason,
    });

    return {
      analysis: result.analysis,
      shouldContinue: false,
      shouldEscalate: true,
      escalationReason: result.escalationReason,
      reason: result.reason,
    };
  }

  // Возвращаем результат
  return {
    analysis: result.analysis,
    shouldContinue: result.shouldContinue,
    reason: result.reason,
    nextQuestion: result.nextQuestion,
    waitingForCandidateResponse: result.waitingForCandidateResponse,
    isSimpleAcknowledgment: result.isSimpleAcknowledgment,
  };
}

/**
 * Gets interview context from database
 */
export async function getInterviewContext(
  chatSessionId: string,
): Promise<InterviewContext | null> {
  type MessageType = {
    role: string;
    content: string | null;
    type?: string;
    voiceTranscription?: string | null;
    createdAt: Date;
  };

  type SessionType = {
    id: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown> | null;
    messages: MessageType[];
  };

  const session = (await db.query.chatSession.findFirst({
    where: eq(chatSession.id, chatSessionId),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  })) as SessionType | undefined;

  if (!session) {
    return null;
  }

  const metadata = parseMetadata(session.metadata);
  const questionAnswers = metadata.questionAnswers ?? [];

  // Формируем историю диалога с правильными типами
  const conversationHistory = session.messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      sender: msg.role as "user" | "assistant",
      content:
        msg.type === "voice" && msg.voiceTranscription
          ? msg.voiceTranscription
          : msg.content || "",
      contentType: (msg.type === "text" || msg.type === "voice"
        ? msg.type
        : undefined) as "text" | "voice" | undefined,
    }));

  // Определяем источник: vacancy_response или gig_response
  const isGig = session.entityType === "gig_response";
  const entityId = session.entityId;

  let candidateName: string | null = null;
  let vacancyTitle: string | null = null;
  let vacancyDescription: string | null = null;
  let responseId: string | null = null;
  let gigResponseId: string | null = null;
  let resumeLanguage: string | null = "ru";
  let companySettings: InterviewContext["companySettings"] | undefined;
  let customBotInstructions: string | null = null;
  let customOrganizationalQuestions: string | null = null;
  let customInterviewQuestions: string | null = null;
  let interviewMediaFiles: InterviewContext["interviewMediaFiles"] | undefined;

  if (isGig) {
    gigResponseId = entityId;
    const gigResponse = await db.query.gigResponse.findFirst({
      where: (gr, { eq }) => eq(gr.id, entityId),
      with: {
        gig: {
          columns: {
            id: true,
            title: true,
            description: true,
            customBotInstructions: true,
            customOrganizationalQuestions: true,
            customInterviewQuestions: true,
          },
          with: {
            workspace: {
              with: {
                companySettings: true,
              },
            },
          },
        },
      },
    });

    if (gigResponse) {
      candidateName = gigResponse.candidateName;
      resumeLanguage = gigResponse.resumeLanguage || "ru";
      vacancyTitle = gigResponse.gig?.title || null;
      vacancyDescription = gigResponse.gig?.description
        ? stripHtml(gigResponse.gig.description).result
        : null;
      customBotInstructions = gigResponse.gig?.customBotInstructions || null;
      customOrganizationalQuestions =
        gigResponse.gig?.customOrganizationalQuestions || null;
      customInterviewQuestions =
        gigResponse.gig?.customInterviewQuestions || null;

      const workspace = gigResponse.gig?.workspace;
      if (workspace?.companySettings) {
        companySettings = {
          botName: workspace.companySettings.botName || undefined,
          botRole: workspace.companySettings.botRole || undefined,
          name: workspace.companySettings.name,
          description: workspace.companySettings.description || undefined,
        };
      }

      // Получаем медиафайлы для gig
      if (gigResponse.gig) {
        const { getDownloadUrl } = await import("@qbs-autonaim/lib/s3");
        const gigId = gigResponse.gig.id;

        const mediaRecords = await db.query.gigInterviewMedia.findMany({
          where: (media, { eq }) => eq(media.gigId, gigId),
          with: {
            file: true,
          },
        });

        interviewMediaFiles = await Promise.all(
          mediaRecords.map(async (record) => {
            try {
              const url = await getDownloadUrl(record.file.key);
              return {
                id: record.file.id,
                fileName: record.file.fileName,
                mimeType: record.file.mimeType,
                url,
              };
            } catch {
              return null;
            }
          }),
        ).then((results) =>
          results.filter((f): f is NonNullable<typeof f> => f !== null),
        );

        if (interviewMediaFiles && interviewMediaFiles.length === 0) {
          interviewMediaFiles = undefined;
        }
      }
    }
  } else {
    responseId = entityId;
    const vacancyResponse = await db.query.vacancyResponse.findFirst({
      where: (vr, { eq }) => eq(vr.id, entityId),
      with: {
        vacancy: {
          columns: {
            title: true,
            description: true,
            customBotInstructions: true,
            customOrganizationalQuestions: true,
            customInterviewQuestions: true,
          },
          with: {
            workspace: {
              with: {
                companySettings: true,
              },
            },
          },
        },
      },
    });

    if (vacancyResponse) {
      candidateName = vacancyResponse.candidateName;
      resumeLanguage = vacancyResponse.resumeLanguage || "ru";
      vacancyTitle = vacancyResponse.vacancy?.title || null;
      vacancyDescription = vacancyResponse.vacancy?.description
        ? stripHtml(vacancyResponse.vacancy.description).result
        : null;
      customBotInstructions =
        vacancyResponse.vacancy?.customBotInstructions || null;
      customOrganizationalQuestions =
        vacancyResponse.vacancy?.customOrganizationalQuestions || null;
      customInterviewQuestions =
        vacancyResponse.vacancy?.customInterviewQuestions || null;

      const workspace = vacancyResponse.vacancy?.workspace;
      if (workspace?.companySettings) {
        companySettings = {
          botName: workspace.companySettings.botName || undefined,
          botRole: workspace.companySettings.botRole || undefined,
          name: workspace.companySettings.name,
          description: workspace.companySettings.description || undefined,
        };
      }
    }
  }

  return {
    chatSessionId: session.id,
    candidateName,
    vacancyTitle,
    vacancyDescription,
    questionNumber: questionAnswers.length + 1,
    responseId,
    gigResponseId,
    resumeLanguage,
    conversationHistory,
    companySettings,
    customBotInstructions,
    customOrganizationalQuestions,
    customInterviewQuestions,
    interviewMediaFiles,
  };
}

/**
 * Saves question and answer to chatSession metadata
 */
export async function saveQuestionAnswer(
  chatSessionId: string,
  question: string,
  answer: string,
) {
  const { updateChatSessionMetadata, getChatSessionMetadata } = await import(
    "@qbs-autonaim/shared"
  );

  // Получаем текущие метаданные
  const metadata = await getChatSessionMetadata(chatSessionId);
  const questionAnswers = metadata.questionAnswers ?? [];

  // Добавляем новую пару вопрос-ответ
  questionAnswers.push({ question, answer });

  // Обновляем метаданные с использованием оптимистической блокировки
  const success = await updateChatSessionMetadata(chatSessionId, {
    questionAnswers,
  });

  if (!success) {
    throw new Error(
      `Failed to save question-answer for chatSession ${chatSessionId} after multiple retries`,
    );
  }
}

/**
 * Creates final scoring based on entire interview
 */
export async function createInterviewScoring(
  context: InterviewContext,
): Promise<InterviewScoring> {
  const { candidateName, vacancyTitle, vacancyDescription } = context;

  // Создаем агента
  const model = createAgentModel();
  const factory = new AgentFactory({ model });
  const agent = factory.createInterviewScoring();

  // Формируем контекст для агента
  const agentContext = {
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: context.conversationHistory || [],
  };

  // Выполняем агента
  const result = await agent.execute({}, agentContext);

  // Обработка ошибки
  if (!result.success || !result.data) {
    logger.error("Interview scoring agent failed", {
      error: result.error,
      chatSessionId: context.chatSessionId,
    });

    return {
      score: INTERVIEW.DEFAULT_FALLBACK_SCORE,
      detailedScore: INTERVIEW.DEFAULT_FALLBACK_DETAILED_SCORE,
      analysis: "Failed to analyze interview automatically",
    };
  }

  // Возвращаем результат
  return {
    score: result.data.score,
    detailedScore: result.data.detailedScore,
    analysis: result.data.analysis,
  };
}
