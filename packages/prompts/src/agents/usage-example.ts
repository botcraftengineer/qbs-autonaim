/**
 * Пример использования мультиагентной системы с реальными AI вызовами
 */

import { openai } from "@ai-sdk/openai";
import type { BaseAgentContext, WorkflowState } from "./types";
import { InterviewWorkflow } from "./workflows/interview-workflow";

/**
 * Пример 1: Базовое использование workflow
 */
export async function basicWorkflowExample() {
  // Создаем workflow с моделью OpenAI
  const workflow = new InterviewWorkflow({
    model: openai("gpt-4o"),
    maxSteps: 20,
    maxVoiceMessages: 2,
  });

  // Начальное состояние
  const initialState: WorkflowState = {
    currentStage: "AWAITING_PIN",
    voiceMessagesCount: 0,
    questionsAsked: 0,
    shouldContinue: true,
    metadata: {},
  };

  // Контекст вакансии
  const context: BaseAgentContext = {
    vacancyTitle: "Senior Frontend Developer",
    vacancyRequirements: "React, TypeScript, 5+ лет опыта",
    conversationHistory: [],
  };

  // Выполняем шаг интервью
  const result = await workflow.executeStep(
    "Здравствуйте! Расскажите о вакансии",
    initialState,
    context,
  );

  console.log("Ответ бота:", result.response);
  console.log("Решение:", result.decision);
  console.log("Обновленное состояние:", result.updatedState);

  return result;
}

/**
 * Пример 2: Использование отдельных агентов
 */
export async function individualAgentsExample() {
  const { EnhancedContextAnalyzerAgent } = await import(
    "./enhanced-context-analyzer"
  );
  const { openai } = await import("@ai-sdk/openai");

  // Создаем агент анализа контекста
  const contextAnalyzer = new EnhancedContextAnalyzerAgent({
    model: openai("gpt-4o"),
  });

  const context: BaseAgentContext = {
    vacancyTitle: "Senior Frontend Developer",
    conversationHistory: [],
  };

  // Анализируем сообщение
  const result = await contextAnalyzer.execute(
    {
      message: "Спасибо за информацию!",
      previousMessages: [],
    },
    context,
  );

  if (result.success && result.data) {
    console.log("Тип сообщения:", result.data.messageType);
    console.log("Требуется ответ:", result.data.requiresResponse);
    console.log("Настроение:", result.data.sentiment);
  }

  return result;
}

/**
 * Пример 3: Полный цикл интервью
 */
export async function fullInterviewExample() {
  const workflow = new InterviewWorkflow({
    model: openai("gpt-4o"),
  });

  const initialState: WorkflowState = {
    currentStage: "AWAITING_PIN",
    voiceMessagesCount: 0,
    questionsAsked: 0,
    shouldContinue: true,
    metadata: {},
  };

  const context: BaseAgentContext = {
    vacancyTitle: "Senior Frontend Developer",
    vacancyRequirements: "React, TypeScript, 5+ лет опыта",
    conversationHistory: [],
  };

  // Симуляция диалога
  const messages = [
    { role: "user" as const, content: "Здравствуйте! Расскажите о вакансии" },
    {
      role: "user" as const,
      content: "У меня 6 лет опыта с React и TypeScript",
    },
    { role: "user" as const, content: "Какой график работы?" },
  ];

  const result = await workflow.runInterview(messages, context, initialState);

  console.log("Статус интервью:", result.status);
  console.log("Количество шагов:", result.steps.length);
  console.log("Финальное состояние:", result.finalState);

  return result;
}

/**
 * Пример 4: Использование оркестратора напрямую
 */
export async function orchestratorExample() {
  const { InterviewOrchestrator } = await import("./orchestrator");
  const { openai } = await import("@ai-sdk/openai");

  const orchestrator = new InterviewOrchestrator({
    model: openai("gpt-4o"),
  });

  const context: BaseAgentContext = {
    vacancyTitle: "Senior Frontend Developer",
    conversationHistory: [
      { sender: "BOT", content: "Добрый день! Расскажите о вашем опыте" },
    ],
  };

  const result = await orchestrator.execute(
    {
      message: "У меня 6 лет опыта с React",
      currentState: {
        currentStage: "INTERVIEWING",
        voiceMessagesCount: 0,
        questionsAsked: 1,
        shouldContinue: true,
        metadata: {},
      },
    },
    context,
  );

  console.log("Трассировка агентов:");
  for (const trace of result.agentTrace) {
    console.log(`- ${trace.agent} @ ${trace.timestamp.toISOString()}`);
  }

  return result;
}

/**
 * Пример 5: Обработка эскалации
 */
export async function escalationExample() {
  const { EnhancedEscalationDetectorAgent } = await import(
    "./enhanced-escalation-detector"
  );
  const { openai } = await import("@ai-sdk/openai");

  const escalationDetector = new EnhancedEscalationDetectorAgent({
    model: openai("gpt-4o"),
  });

  const context: BaseAgentContext = {
    vacancyTitle: "Senior Frontend Developer",
    conversationHistory: [],
  };

  // Проверяем сообщение на необходимость эскалации
  const result = await escalationDetector.execute(
    {
      message: "Хочу поговорить с живым человеком!",
      conversationLength: 5,
    },
    context,
  );

  if (result.success && result.data?.shouldEscalate) {
    console.log("Требуется эскалация!");
    console.log("Причина:", result.data.reason);
    console.log("Срочность:", result.data.urgency);
    console.log("Рекомендуемое действие:", result.data.suggestedAction);
  }

  return result;
}

/**
 * Пример 6: Оценка интервью
 */
export async function evaluationExample() {
  const { EnhancedEvaluatorAgent } = await import("./enhanced-evaluator");
  const { openai } = await import("@ai-sdk/openai");

  const evaluator = new EnhancedEvaluatorAgent({
    model: openai("gpt-4o"),
  });

  const context: BaseAgentContext = {
    vacancyTitle: "Senior Frontend Developer",
    vacancyRequirements: "React, TypeScript, 5+ лет опыта",
    conversationHistory: [],
  };

  const result = await evaluator.execute(
    {
      question: "Расскажите о вашем опыте с React",
      answer:
        "Работаю с React 6 лет, создавал крупные SPA, использовал Redux, MobX, React Query",
      allQA: [],
    },
    context,
  );

  if (result.success && result.data) {
    console.log("Оценка:", result.data.score, "/5");
    console.log("Детальная оценка:", result.data.detailedScore, "/100");
    console.log("Анализ:", result.data.analysis);
    console.log("Сильные стороны:", result.data.strengths);
    console.log("Слабые стороны:", result.data.weaknesses);
    console.log("Рекомендация:", result.data.recommendation);
  }

  return result;
}
