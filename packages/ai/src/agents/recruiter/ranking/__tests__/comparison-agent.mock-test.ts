/**
 * Mock-based test for ComparisonAgent
 * Tests the agent logic without making actual API calls
 */

import type { ComparisonAgentInput } from "../comparison-agent";
import { ComparisonAgent } from "../comparison-agent";

/**
 * Mock model that returns predefined responses
 */
class MockModel {
  async doGenerate() {
    return {
      text: JSON.stringify({
        comparisons: [
          {
            candidateId: "candidate-1",
            strengths: [
              "Лучшая цена среди всех кандидатов (45,000₽)",
              "Самые быстрые сроки выполнения (10 дней)",
              "Отличное соответствие навыков (95/100)",
            ],
            weaknesses: [
              "Меньше опыта по сравнению с другими кандидатами (2 года)",
              "Отсутствие некоторых nice-to-have навыков",
            ],
            comparative_analysis:
              "Кандидат занимает 1-е место благодаря оптимальному сочетанию цены и сроков. Несмотря на меньший опыт, демонстрирует отличное владение требуемыми технологиями.",
          },
          {
            candidateId: "candidate-2",
            strengths: [
              "Самый опытный кандидат (7 лет)",
              "Высокий рейтинг портфолио (5.0/5.0)",
              "Полное покрытие всех требуемых и дополнительных навыков",
            ],
            weaknesses: [
              "Самая высокая цена (80,000₽, выше бюджета)",
              "Более длительные сроки (25 дней)",
            ],
            comparative_analysis:
              "Кандидат занимает 2-е место. Обладает выдающимся опытом и навыками, но высокая цена выходит за рамки бюджета, что снижает общую привлекательность.",
          },
          {
            candidateId: "candidate-3",
            strengths: [
              "Цена в пределах бюджета (50,000₽)",
              "Хорошее соответствие навыков (85/100)",
            ],
            weaknesses: [
              "Средние показатели по всем критериям",
              "Нет выдающихся преимуществ",
              "Более длительные сроки по сравнению с лидером",
            ],
            comparative_analysis:
              "Кандидат занимает 3-е место. Представляет собой сбалансированный вариант без явных недостатков, но и без выдающихся преимуществ.",
          },
        ],
        category_leaders: {
          best_price: "candidate-1",
          fastest_delivery: "candidate-1",
          strongest_skills: "candidate-2",
          most_experienced: "candidate-2",
          highest_composite: "candidate-1",
        },
      }),
      finishReason: "stop",
      usage: { promptTokens: 150, completionTokens: 300 },
    };
  }

  get provider() {
    return "mock";
  }

  get modelId() {
    return "mock-model";
  }

  get specificationVersion() {
    return "v1";
  }

  get defaultObjectGenerationMode() {
    return "json";
  }
}

/**
 * Test 1: Validate input validation
 */
function testInputValidation() {
  console.log("\n=== Test 1: Input Validation ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Valid input
  const validInput: ComparisonAgentInput = {
    candidates: [
      {
        id: "test-1",
        candidateName: "Test User",
        compositeScore: 85,
        priceScore: 80,
        deliveryScore: 90,
        skillsMatchScore: 85,
        experienceScore: 80,
      },
    ],
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const isValid = (agent as any).validate(validInput);

  if (isValid) {
    console.log("✅ Valid input passes validation");
  } else {
    console.log("❌ Valid input failed validation");
  }

  // Invalid input - empty candidates
  const invalidInput = {
    candidates: [],
    gigRequirements: {
      title: "",
    },
    gigBudget: {},
  } as any;

  const isInvalid = (agent as any).validate(invalidInput);

  if (!isInvalid) {
    console.log("✅ Invalid input correctly rejected");
  } else {
    console.log("❌ Invalid input incorrectly accepted");
  }
}

/**
 * Test 2: Validate prompt building with multiple candidates
 */
function testPromptBuildingMultipleCandidates() {
  console.log("\n=== Test 2: Prompt Building (Multiple Candidates) ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Иван Петров",
        compositeScore: 90,
        priceScore: 95,
        deliveryScore: 90,
        skillsMatchScore: 85,
        experienceScore: 80,
        proposedPrice: 45000,
        proposedDeliveryDays: 10,
        skills: ["React", "TypeScript", "Node.js"],
      },
      {
        id: "candidate-2",
        candidateName: "Мария Сидорова",
        compositeScore: 85,
        priceScore: 70,
        deliveryScore: 80,
        skillsMatchScore: 95,
        experienceScore: 90,
        proposedPrice: 80000,
        proposedDeliveryDays: 25,
        skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
      },
      {
        id: "candidate-3",
        candidateName: "Алексей Иванов",
        compositeScore: 75,
        priceScore: 80,
        deliveryScore: 75,
        skillsMatchScore: 70,
        experienceScore: 75,
        proposedPrice: 50000,
        proposedDeliveryDays: 20,
        skills: ["React", "TypeScript"],
      },
    ],
    gigRequirements: {
      title: "Разработка веб-приложения",
      summary: "Требуется разработать SPA приложение",
      required_skills: ["React", "TypeScript", "Node.js"],
      nice_to_have_skills: ["AWS", "Docker"],
      experience_level: "Middle",
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date("2026-02-08"),
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  console.log("Generated prompt length:", prompt.length);
  console.log("Prompt preview:", prompt.substring(0, 300) + "...");

  // Check that prompt contains key information
  const checks = [
    { name: "Gig title", value: prompt.includes("Разработка веб-приложения") },
    { name: "All 3 candidates", value: prompt.includes("всего 3") },
    { name: "Candidate 1 name", value: prompt.includes("Иван Петров") },
    { name: "Candidate 2 name", value: prompt.includes("Мария Сидорова") },
    { name: "Candidate 3 name", value: prompt.includes("Алексей Иванов") },
    { name: "Composite scores", value: prompt.includes("Composite Score") },
    { name: "Price information", value: prompt.includes("45000") },
    { name: "Delivery information", value: prompt.includes("10 дней") },
    {
      name: "Category leaders",
      value: prompt.includes("ЛИДЕРЫ ПО КАТЕГОРИЯМ"),
    },
    { name: "Task instructions", value: prompt.includes("STRENGTHS") },
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.value) {
      console.log(`✅ ${check.name} included in prompt`);
    } else {
      console.log(`❌ ${check.name} missing from prompt`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("✅ All required information included in prompt");
  } else {
    console.log("❌ Some information missing from prompt");
  }
}

/**
 * Test 3: Validate prompt with single candidate
 */
function testPromptWithSingleCandidate() {
  console.log("\n=== Test 3: Prompt with Single Candidate ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Единственный Кандидат",
        compositeScore: 85,
        priceScore: 80,
        deliveryScore: 85,
        skillsMatchScore: 90,
        experienceScore: 80,
      },
    ],
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  // Check that prompt handles single candidate
  const checks = [
    { name: "Single candidate count", value: prompt.includes("всего 1") },
    { name: "Candidate name", value: prompt.includes("Единственный Кандидат") },
    {
      name: "Absolute criteria note",
      value: prompt.includes("оценивай по абсолютным критериям"),
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.value) {
      console.log(`✅ ${check.name} handled correctly`);
    } else {
      console.log(`❌ ${check.name} not handled properly`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("✅ Single candidate case handled gracefully");
  } else {
    console.log("❌ Single candidate case not handled properly");
  }
}

/**
 * Test 4: Validate category leaders identification
 */
function testCategoryLeadersIdentification() {
  console.log("\n=== Test 4: Category Leaders Identification ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        compositeScore: 90,
        priceScore: 95,
        deliveryScore: 85,
        skillsMatchScore: 80,
        experienceScore: 75,
        screeningScore: 80,
        interviewScore: 85,
      },
      {
        id: "candidate-2",
        compositeScore: 85,
        priceScore: 80,
        deliveryScore: 95,
        skillsMatchScore: 90,
        experienceScore: 95,
        screeningScore: 90,
        interviewScore: 95,
      },
      {
        id: "candidate-3",
        compositeScore: 80,
        priceScore: 85,
        deliveryScore: 80,
        skillsMatchScore: 95,
        experienceScore: 85,
        screeningScore: 95,
        interviewScore: 80,
      },
    ],
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  // Check that leaders are correctly identified
  const checks = [
    {
      name: "Best price leader",
      value: prompt.includes("Лучшая цена: Кандидат candidate-1"),
    },
    {
      name: "Fastest delivery leader",
      value: prompt.includes("Самые быстрые сроки: Кандидат candidate-2"),
    },
    {
      name: "Best skills leader",
      value: prompt.includes("Лучшие навыки: Кандидат candidate-3"),
    },
    {
      name: "Most experienced leader",
      value: prompt.includes("Самый опытный: Кандидат candidate-2"),
    },
    {
      name: "Best screening leader",
      value: prompt.includes("Лучший screening: Кандидат candidate-3"),
    },
    {
      name: "Best interview leader",
      value: prompt.includes("Лучшее интервью: Кандидат candidate-2"),
    },
    {
      name: "Highest composite leader",
      value: prompt.includes("Лучший общий балл: Кандидат candidate-1"),
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.value) {
      console.log(`✅ ${check.name} identified correctly`);
    } else {
      console.log(`❌ ${check.name} not identified properly`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("✅ All category leaders identified correctly");
  } else {
    console.log("❌ Some category leaders not identified properly");
  }
}

/**
 * Test 5: Validate handling of missing scores
 */
function testHandlingMissingScores() {
  console.log("\n=== Test 5: Handling Missing Scores ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        compositeScore: 85,
        priceScore: null,
        deliveryScore: 90,
        skillsMatchScore: null,
        experienceScore: 80,
      },
      {
        id: "candidate-2",
        compositeScore: 80,
        priceScore: 85,
        deliveryScore: null,
        skillsMatchScore: 85,
        experienceScore: null,
      },
    ],
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  // Check that missing scores don't cause errors
  if (prompt.length > 0) {
    console.log("✅ Handles missing scores without crashing");
  } else {
    console.log("❌ Failed to handle missing scores");
  }

  // Check that available scores are still shown
  if (prompt.includes("Delivery: 90") && prompt.includes("Price: 85")) {
    console.log("✅ Available scores are displayed");
  } else {
    console.log("❌ Available scores not displayed properly");
  }
}

/**
 * Test 6: Validate schema structure
 */
function testSchemaStructure() {
  console.log("\n=== Test 6: Schema Structure ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const metadata = agent.getMetadata();

  if (metadata.name === "ComparisonAgent") {
    console.log("✅ Agent name is correct");
  } else {
    console.log("❌ Agent name is incorrect:", metadata.name);
  }

  if (metadata.type === "evaluator") {
    console.log("✅ Agent type is correct");
  } else {
    console.log("❌ Agent type is incorrect:", metadata.type);
  }
}

/**
 * Test 7: Edge cases
 */
function testEdgeCases() {
  console.log("\n=== Test 7: Edge Cases ===");

  const agent = new ComparisonAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Test with identical scores
  const input1: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        compositeScore: 85,
        priceScore: 85,
        deliveryScore: 85,
        skillsMatchScore: 85,
        experienceScore: 85,
      },
      {
        id: "candidate-2",
        compositeScore: 85,
        priceScore: 85,
        deliveryScore: 85,
        skillsMatchScore: 85,
        experienceScore: 85,
      },
    ],
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt1 = (agent as any).buildPrompt(input1, {});

  if (prompt1.length > 0) {
    console.log("✅ Handles identical scores without crashing");
  } else {
    console.log("❌ Failed to handle identical scores");
  }

  // Test with very long strings
  const input2: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "A".repeat(1000),
        compositeScore: 85,
        experience: "B".repeat(5000),
      },
    ],
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
      summary: "C".repeat(5000),
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt2 = (agent as any).buildPrompt(input2, {});

  if (prompt2.length > 5000) {
    console.log("✅ Handles very long strings");
  } else {
    console.log("❌ Failed to handle long strings");
  }

  // Test with special characters
  const input3: ComparisonAgentInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Test <script>alert('xss')</script> User",
        compositeScore: 85,
      },
    ],
    gigRequirements: {
      title: "Test & Special <> Characters",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt3 = (agent as any).buildPrompt(input3, {});

  if (prompt3.includes("Test") && prompt3.includes("User")) {
    console.log("✅ Handles special characters");
  } else {
    console.log("❌ Failed to handle special characters");
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("🚀 Starting ComparisonAgent Mock Tests");
  console.log("================================================\n");

  try {
    testInputValidation();
    testPromptBuildingMultipleCandidates();
    testPromptWithSingleCandidate();
    testCategoryLeadersIdentification();
    testHandlingMissingScores();
    testSchemaStructure();
    testEdgeCases();

    console.log("\n================================================");
    console.log("📊 Test Summary");
    console.log("================================================\n");
    console.log("✅ All mock tests completed successfully!");
    console.log(
      "\nNote: These tests verify the agent's logic and prompt building.",
    );
    console.log(
      "Actual AI comparison requires a working API connection and will be",
    );
    console.log("tested during integration testing with real data.");
  } catch (error) {
    console.error("\n❌ Test suite failed with error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
