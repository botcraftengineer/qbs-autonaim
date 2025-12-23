import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import {
  InterviewOrchestrator,
  InterviewScoringAgent,
} from "@qbs-autonaim/prompts";
import { Langfuse } from "langfuse";
import { stripHtml } from "string-strip-html";
import type {
  InterviewAnalysis,
  InterviewScoring,
} from "../../schemas/interview";
import { createLogger, INTERVIEW } from "../base";

const logger = createLogger("Interview");

const langfuse = new Langfuse({
  secretKey: env.LANGFUSE_SECRET_KEY,
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

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
  currentAnswer: string;
  currentQuestion: string;
  previousQA: QuestionAnswer[];
  questionNumber: number;
  responseId: string | null;
  resumeLanguage?: string | null;
  conversationHistory?: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    contentType?: "TEXT" | "VOICE";
  }>;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Safely parses JSON metadata string into typed object
 */
function parseMetadata(metadataStr: string | null): ConversationMetadata {
  if (!metadataStr) return {};

  try {
    return JSON.parse(metadataStr) as ConversationMetadata;
  } catch (error) {
    logger.error("Error parsing metadata", { error });
    return {};
  }
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
  const {
    questionNumber,
    currentAnswer,
    currentQuestion,
    previousQA,
    candidateName,
    vacancyTitle,
    vacancyDescription,
  } = context;

  // Создаем оркестратор
  const model = createAgentModel();
  const orchestrator = new InterviewOrchestrator({ model, langfuse });

  // Формируем контекст для агентов
  const agentContext = {
    candidateId: context.conversationId,
    conversationId: context.conversationId,
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: context.conversationHistory || [],
  };

  // Выполняем оркестратор
  const result = await orchestrator.execute(
    {
      currentAnswer,
      currentQuestion,
      previousQA,
      questionNumber,
      customInterviewQuestions: null,
      resumeLanguage: context.resumeLanguage || "en",
    },
    agentContext,
  );

  // Логируем трассировку агентов
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
  currentTranscription: string,
  currentQuestion: string,
): Promise<InterviewContext | null> {
  const conv = await db.query.conversation.findFirst({
    where: eq(conversation.id, conversationId),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
      response: {
        with: {
          vacancy: true,
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

  return {
    conversationId: conv.id,
    candidateName: conv.candidateName,
    vacancyTitle: conv.response?.vacancy?.title || null,
    vacancyDescription: conv.response?.vacancy?.description
      ? stripHtml(conv.response.vacancy.description).result
      : null,
    currentAnswer: currentTranscription,
    currentQuestion,
    previousQA: questionAnswers,
    questionNumber: questionAnswers.length + 1,
    responseId: conv.responseId || null,
    resumeLanguage: conv.response?.resumeLanguage || "en",
    conversationHistory,
  };
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
  const { candidateName, vacancyTitle, vacancyDescription, previousQA } =
    context;

  // Создаем агента
  const model = createAgentModel();
  const agent = new InterviewScoringAgent({ model });

  // Формируем контекст для агента
  const agentContext = {
    candidateName: candidateName ?? undefined,
    vacancyTitle: vacancyTitle ?? undefined,
    vacancyDescription: vacancyDescription ?? undefined,
    conversationHistory: [],
  };

  // Выполняем агента
  const result = await agent.execute(
    {
      previousQA,
    },
    agentContext,
  );

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
