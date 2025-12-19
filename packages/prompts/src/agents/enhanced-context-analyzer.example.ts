/**
 * Примеры использования EnhancedContextAnalyzerAgent
 */

import { openai } from "@ai-sdk/openai";
import { EnhancedContextAnalyzerAgent } from "./enhanced-context-analyzer";
import type { BaseAgentContext } from "./types";

// Инициализация агента
const analyzer = new EnhancedContextAnalyzerAgent({
  model: openai("gpt-4o-mini"),
  maxTokens: 1000,
});

// Базовый контекст
const context: BaseAgentContext = {
  conversationHistory: [],
  candidateName: "Иван Иванов",
  vacancyTitle: "Frontend Developer",
};

// Пример 1: Обработка пин-кода (быстрый путь без AI)
async function example1() {
  const result = await analyzer.execute(
    {
      message: "1234",
    },
    context,
  );

  console.log("Пример 1 - Пин-код:");
  console.log(result);
  // Результат:
  // {
  //   success: true,
  //   data: {
  //     messageType: "PIN_CODE",
  //     intent: "Отправка пин-кода для верификации",
  //     requiresResponse: true,
  //     sentiment: "NEUTRAL",
  //     topics: ["верификация", "пин-код"],
  //     confidence: 0.95,
  //     extractedData: { pinCode: "1234" }
  //   },
  //   metadata: { agentName: "EnhancedContextAnalyzer", fastPath: true }
  // }
}

// Пример 2: Пин-код с пробелами
async function example2() {
  const result = await analyzer.execute(
    {
      message: "12 34",
    },
    context,
  );

  console.log("Пример 2 - Пин-код с пробелами:");
  console.log(result);
  // extractedData: { pinCode: "1234" }
}

// Пример 3: Приветствие
async function example3() {
  const result = await analyzer.execute(
    {
      message: "Привет! Готов к собеседованию",
    },
    context,
  );

  console.log("Пример 3 - Приветствие:");
  console.log(result);
  // messageType: "GREETING"
  // requiresResponse: true
}

// Пример 4: Простое подтверждение (не требует ответа)
async function example4() {
  const result = await analyzer.execute(
    {
      message: "ок",
      previousMessages: [
        { sender: "BOT", content: "Отлично, начнём через 5 минут" },
      ],
    },
    context,
  );

  console.log("Пример 4 - Подтверждение:");
  console.log(result);
  // messageType: "ACKNOWLEDGMENT"
  // requiresResponse: false
}

// Пример 5: Вопрос кандидата
async function example5() {
  const result = await analyzer.execute(
    {
      message: "А сколько будет длиться собеседование?",
    },
    context,
  );

  console.log("Пример 5 - Вопрос:");
  console.log(result);
  // messageType: "QUESTION"
  // requiresResponse: true
  // topics: ["длительность", "собеседование"]
}

// Пример 6: Просьба отложить
async function example6() {
  const result = await analyzer.execute(
    {
      message: "Можно перенести на завтра? Сейчас не могу",
    },
    context,
  );

  console.log("Пример 6 - Просьба отложить:");
  console.log(result);
  // messageType: "POSTPONE_REQUEST"
  // requiresResponse: true
  // sentiment: "NEUTRAL" или "NEGATIVE"
}

// Пример 7: Отказ
async function example7() {
  const result = await analyzer.execute(
    {
      message: "Спасибо, но я передумал. Не хочу проходить собеседование",
    },
    context,
  );

  console.log("Пример 7 - Отказ:");
  console.log(result);
  // messageType: "REFUSAL"
  // requiresResponse: true
  // sentiment: "NEGATIVE"
}

// Запуск всех примеров
async function runAllExamples() {
  await example1();
  await example2();
  await example3();
  await example4();
  await example5();
  await example6();
  await example7();
}

// runAllExamples();
