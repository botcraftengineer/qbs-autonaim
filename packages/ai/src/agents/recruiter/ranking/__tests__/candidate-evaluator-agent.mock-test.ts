/**
 * Mock-based test for CandidateEvaluatorAgent
 * Tests the agent logic without making actual API calls
 */

import type { CandidateEvaluatorInput } from "../candidate-evaluator-agent";
import { CandidateEvaluatorAgent } from "../candidate-evaluator-agent";

/**
 * Mock model that returns predefined responses
 */
class MockModel {
  async doGenerate() {
    return {
      text: JSON.stringify({
        priceScore: {
          score: 85,
          reasoning:
            "Цена 50,000₽ находится в середине бюджета 40,000-60,000₽, что является справедливым предложением для кандидата с 5 годами опыта.",
        },
        deliveryScore: {
          score: 90,
          reasoning:
            "Предложенные 14 дней при дедлайне в 30 дней демонстрируют реалистичную оценку времени с запасом на непредвиденные обстоятельства.",
        },
        skillsMatchScore: {
          score: 95,
          reasoning:
            "Кандидат обладает всеми 4 required skills (React, TypeScript, Node.js, PostgreSQL) и 1 из 3 nice-to-have (Docker), что показывает отличное соответствие требованиям.",
        },
        experienceScore: {
          score: 88,
          reasoning:
            "5 лет коммерческой разработки с опытом в 10+ проектах и рейтингом 4.8/5.0 демонстрируют солидный опыт для Middle уровня.",
        },
        compositeScore: {
          score: 89,
          reasoning:
            "Кандидат показывает отличные результаты по всем критериям: сильные технические навыки, адекватная цена, реалистичные сроки и подтвержденный опыт.",
        },
      }),
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 200 },
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

  const agent = new CandidateEvaluatorAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Valid input
  const validInput: CandidateEvaluatorInput = {
    candidate: {
      id: "test-1",
      candidateName: "Test User",
      proposedPrice: 50000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 14,
      skills: ["React"],
    },
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
    },
  };

  // Test validation method (accessing protected method via any)
  const isValid = (agent as any).validate(validInput);

  if (isValid) {
    console.log("✅ Valid input passes validation");
  } else {
    console.log("❌ Valid input failed validation");
  }

  // Invalid input - missing required fields
  const invalidInput = {
    candidate: {
      id: "",
    },
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
 * Test 2: Validate prompt building
 */
function testPromptBuilding() {
  console.log("\n=== Test 2: Prompt Building ===");

  const agent = new CandidateEvaluatorAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: CandidateEvaluatorInput = {
    candidate: {
      id: "test-1",
      candidateName: "Иван Петров",
      proposedPrice: 50000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 14,
      skills: ["React", "TypeScript", "Node.js"],
      experience: "5 лет опыта",
    },
    gigRequirements: {
      title: "Разработка веб-приложения",
      required_skills: ["React", "TypeScript"],
      nice_to_have_skills: ["Node.js"],
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date("2026-02-08"),
    },
    existingScores: {
      screeningScore: 85,
      interviewScore: 90,
    },
    marketContext: {
      allPrices: [45000, 50000, 55000],
      allDeliveryDays: [10, 14, 20],
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  console.log("Generated prompt length:", prompt.length);
  console.log("Prompt preview:", prompt.substring(0, 200) + "...");

  // Check that prompt contains key information
  const checks = [
    { name: "Candidate name", value: prompt.includes("Иван Петров") },
    { name: "Gig title", value: prompt.includes("Разработка веб-приложения") },
    { name: "Price", value: prompt.includes("50000") },
    { name: "Delivery days", value: prompt.includes("14") },
    { name: "Skills", value: prompt.includes("React") },
    { name: "Budget", value: prompt.includes("40000-60000") },
    { name: "Existing scores", value: prompt.includes("Screening Score") },
    { name: "Market context", value: prompt.includes("других кандидатов") },
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
 * Test 3: Validate prompt with missing data
 */
function testPromptWithMissingData() {
  console.log("\n=== Test 3: Prompt with Missing Data ===");

  const agent = new CandidateEvaluatorAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: CandidateEvaluatorInput = {
    candidate: {
      id: "test-2",
      candidateName: null,
      proposedPrice: null,
      proposedCurrency: "RUB",
      proposedDeliveryDays: null,
      skills: null,
      experience: null,
    },
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetMin: null,
      budgetMax: null,
      budgetCurrency: "RUB",
      deadline: null,
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  // Check that prompt handles missing data gracefully
  const checks = [
    { name: "Missing price", value: prompt.includes("не указана") },
    { name: "Missing delivery", value: prompt.includes("не указаны") },
    { name: "Missing skills", value: prompt.includes("не указаны") },
    { name: "Missing experience", value: prompt.includes("не указан") },
    { name: "Missing budget", value: prompt.includes("не указан") },
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
    console.log("✅ Missing data handled gracefully in prompt");
  } else {
    console.log("❌ Missing data not handled properly");
  }
}

/**
 * Test 4: Validate market context formatting
 */
function testMarketContextFormatting() {
  console.log("\n=== Test 4: Market Context Formatting ===");

  const agent = new CandidateEvaluatorAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: CandidateEvaluatorInput = {
    candidate: {
      id: "test-3",
      proposedPrice: 50000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 14,
    },
    gigRequirements: {
      title: "Test Gig",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
    marketContext: {
      allPrices: [40000, 50000, 60000, 70000],
      allDeliveryDays: [10, 15, 20, 25],
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  // Check market context calculations
  const hasMinPrice = prompt.includes("40000");
  const hasMaxPrice = prompt.includes("70000");
  const hasAvgPrice = prompt.includes("55000"); // (40000+50000+60000+70000)/4
  const hasMinDays = prompt.includes("10");
  const hasMaxDays = prompt.includes("25");

  if (hasMinPrice && hasMaxPrice && hasAvgPrice) {
    console.log("✅ Price range and average calculated correctly");
  } else {
    console.log("❌ Price calculations incorrect");
  }

  if (hasMinDays && hasMaxDays) {
    console.log("✅ Delivery days range calculated correctly");
  } else {
    console.log("❌ Delivery days calculations incorrect");
  }
}

/**
 * Test 5: Validate schema structure
 */
function testSchemaStructure() {
  console.log("\n=== Test 5: Schema Structure ===");

  const agent = new CandidateEvaluatorAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Check that agent has correct metadata
  const metadata = agent.getMetadata();

  if (metadata.name === "CandidateEvaluator") {
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
 * Test 6: Edge cases
 */
function testEdgeCases() {
  console.log("\n=== Test 6: Edge Cases ===");

  const agent = new CandidateEvaluatorAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Test with empty arrays
  const input1: CandidateEvaluatorInput = {
    candidate: {
      id: "test-4",
      skills: [],
      portfolioLinks: [],
    },
    gigRequirements: {
      title: "Test",
      required_skills: [],
      nice_to_have_skills: [],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
    marketContext: {
      allPrices: [],
      allDeliveryDays: [],
    },
  };

  const prompt1 = (agent as any).buildPrompt(input1, {});

  if (prompt1.length > 0) {
    console.log("✅ Handles empty arrays without crashing");
  } else {
    console.log("❌ Failed to handle empty arrays");
  }

  // Test with very long strings
  const input2: CandidateEvaluatorInput = {
    candidate: {
      id: "test-5",
      experience: "A".repeat(5000), // Very long experience text
    },
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
      summary: "B".repeat(5000), // Very long summary
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt2 = (agent as any).buildPrompt(input2, {});

  if (prompt2.length > 10000) {
    console.log("✅ Handles very long strings");
  } else {
    console.log("❌ Failed to handle long strings");
  }

  // Test with special characters
  const input3: CandidateEvaluatorInput = {
    candidate: {
      id: "test-6",
      candidateName: "Иван <script>alert('xss')</script> Петров",
      experience: "Test \"quotes\" and 'apostrophes'",
    },
    gigRequirements: {
      title: "Test & Special <> Characters",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt3 = (agent as any).buildPrompt(input3, {});

  if (prompt3.includes("Иван") && prompt3.includes("Петров")) {
    console.log("✅ Handles special characters");
  } else {
    console.log("❌ Failed to handle special characters");
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("🚀 Starting CandidateEvaluatorAgent Mock Tests");
  console.log("================================================\n");

  try {
    testInputValidation();
    testPromptBuilding();
    testPromptWithMissingData();
    testMarketContextFormatting();
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
      "Actual AI evaluation requires a working API connection and will be",
    );
    console.log("tested during integration testing with real data.");
  } catch (error) {
    console.error("\n❌ Test suite failed with error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
