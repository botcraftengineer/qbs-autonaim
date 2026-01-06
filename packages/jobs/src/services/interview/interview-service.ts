import { AgentFactory, InterviewOrchestrator } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
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

/** Typed metadata structure for conversation */
interface ConversationMetadata {
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
  conversationId: string;
  candidateName: string | null;
  vacancyTitle: string | null;
  vacancyDescription: string | null;
  questionNumber: number;
  responseId: string | null;
  resumeLanguage?: string | null;
  conversationHistory?: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    contentType?: "TEXT" | "VOICE";
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
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Safely converts metadata to typed object
 */
function parseMetadata(
  metadata: Record<string, unknown> | null,
): ConversationMetadata {
  if (!metadata) return {};

  return metadata as ConversationMetadata;
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
      conversationId: context.conversationId,
      questionNumber,
      type: typeof questionNumber,
    });
    throw new Error("questionNumber must be a non-negative number");
  }

  // Создаем оркестратор
  const model = createAgentModel();
  const orchestrator = new InterviewOrchestrator({ model });

  // Формируем контекст для агентов
  const agentContext = {
    candidateId: context.conversationId,
    conversationId: context.conversationId,
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: context.conversationHistory || [],
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
    conversationId: context.conversationId,
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
      conversationId: context.conversationId,
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
  conversationId: string,
): Promise<InterviewContext | null> {
  const conv = await db.query.conversation.findFirst({
    where: eq(conversation.id, conversationId),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
      response: {
        with: {
          vacancy: {
            with: {
              workspace: {
                with: {
                  companySettings: true,
                },
              },
            },
          },
        },
      },
      gigResponse: {
        with: {
          gig: {
            with: {
              workspace: {
                with: {
                  companySettings: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!conv) {
    return null;
  }

  const metadata = parseMetadata(conv.metadata);
  const questionAnswers = metadata.questionAnswers ?? [];

  // Формируем историю диалога с правильными типами
  const conversationHistory = conv.messages
    .filter((msg) => msg.sender === "CANDIDATE" || msg.sender === "BOT")
    .map((msg) => ({
      sender: msg.sender as "CANDIDATE" | "BOT",
      content:
        msg.contentType === "VOICE" && msg.voiceTranscription
          ? msg.voiceTranscription
          : msg.content,
      contentType: (msg.contentType === "TEXT" || msg.contentType === "VOICE"
        ? msg.contentType
        : undefined) as "TEXT" | "VOICE" | undefined,
    }));

  // Определяем источник: vacancy или gig
  const isGig = !!conv.gigResponse;
  const vacancy = conv.response?.vacancy;
  const gig = conv.gigResponse?.gig;
  const workspace = isGig ? gig?.workspace : vacancy?.workspace;

  // Передаем обе группы вопросов, AI сам решит что спрашивать на основе истории
  const result: InterviewContext = {
    conversationId: conv.id,
    candidateName: conv.candidateName,
    vacancyTitle: isGig ? gig?.title || null : vacancy?.title || null,
    vacancyDescription: isGig
      ? gig?.description || null
      : vacancy?.description
        ? stripHtml(vacancy.description).result
        : null,
    questionNumber: questionAnswers.length + 1,
    responseId: isGig ? conv.gigResponseId : conv.responseId || null,
    resumeLanguage: isGig ? "ru" : conv.response?.resumeLanguage || "ru",
    conversationHistory,
    companySettings: workspace?.companySettings
      ? {
          botName: workspace.companySettings.botName || undefined,
          botRole: workspace.companySettings.botRole || undefined,
          name: workspace.companySettings.name,
          description: workspace.companySettings.description || undefined,
        }
      : undefined,
    customBotInstructions: isGig
      ? gig?.customBotInstructions || null
      : vacancy?.customBotInstructions || null,
    customOrganizationalQuestions: isGig
      ? null
      : vacancy?.customOrganizationalQuestions || null,
    customInterviewQuestions: isGig
      ? gig?.customInterviewQuestions || null
      : vacancy?.customInterviewQuestions || null,
  };

  return result;
}

/**
 * Saves question and answer to conversation metadata
 */
export async function saveQuestionAnswer(
  conversationId: string,
  question: string,
  answer: string,
) {
  const { updateConversationMetadata, getConversationMetadata } = await import(
    "@qbs-autonaim/shared"
  );

  // Получаем текущие метаданные
  const metadata = await getConversationMetadata(conversationId);
  const questionAnswers = metadata.questionAnswers ?? [];

  // Добавляем новую пару вопрос-ответ
  questionAnswers.push({ question, answer });

  // Обновляем метаданные с использованием оптимистической блокировки
  const success = await updateConversationMetadata(conversationId, {
    questionAnswers,
  });

  if (!success) {
    throw new Error(
      `Failed to save question-answer for conversation ${conversationId} after multiple retries`,
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
      conversationId: context.conversationId,
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
