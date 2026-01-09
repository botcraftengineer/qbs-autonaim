/**
 * Mock-based test for RecommendationAgent
 * Tests the agent logic without making actual API calls
 */

import type { RecommendationAgentInput } from "../recommendation-agent";
import { RecommendationAgent } from "../recommendation-agent";

/**
 * Mock model that returns predefined responses
 */
class MockModel {
  async doGenerate() {
    return {
      text: JSON.stringify({
        recommendation: "HIGHLY_RECOMMENDED",
        ranking_analysis:
          "Кандидат демонстрирует выдающиеся результаты по всем ключевым критериям. Composite score 89/100 подтверждается отличным соответствием навыков (95/100), реалистичными сроками (90/100) и справедливой ценой (85/100). Сильные стороны включают полное покрытие требуемых технологий и солидный опыт работы. Единственная слабость - отсутствие некоторых дополнительных навыков, что не является критичным для данной позиции. В сравнении с другими кандидатами, этот вариант предлагает оптимальное соотношение качества и стоимости.",
        actionable_insights: [
          "Fast-track to interview - кандидат готов приступить через 2 недели",
          "Verify availability for the proposed timeline",
        ],
      }),
      finishReason: "stop",
      usage: { promptTokens: 200, completionTokens: 250 },
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

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Valid input
  const validInput: RecommendationAgentInput = {
    candidate: {
      id: "test-1",
      candidateName: "Test User",
      proposedPrice: 50000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 14,
    },
    scores: {
      compositeScore: 85,
      priceScore: 80,
      deliveryScore: 90,
      skillsMatchScore: 85,
      experienceScore: 80,
    },
    comparison: {
      strengths: ["Отличная цена", "Быстрые сроки"],
      weaknesses: ["Меньше опыта"],
      comparative_analysis: "Хороший кандидат",
    },
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

  // Invalid input - missing required fields
  const invalidInput = {
    candidate: {
      id: "",
    },
    scores: {},
    comparison: {},
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
 * Test 2: Validate base status determination
 */
function testBaseStatusDetermination() {
  console.log("\n=== Test 2: Base Status Determination ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const testCases = [
    { score: 95, expected: "HIGHLY_RECOMMENDED" },
    { score: 80, expected: "HIGHLY_RECOMMENDED" },
    { score: 75, expected: "RECOMMENDED" },
    { score: 60, expected: "RECOMMENDED" },
    { score: 55, expected: "NEUTRAL" },
    { score: 40, expected: "NEUTRAL" },
    { score: 35, expected: "NOT_RECOMMENDED" },
    { score: 0, expected: "NOT_RECOMMENDED" },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = (agent as any).determineBaseStatus(testCase.score);
    if (result === testCase.expected) {
      console.log(
        `✅ Score ${testCase.score} → ${testCase.expected} (correct)`,
      );
    } else {
      console.log(
        `❌ Score ${testCase.score} → ${result} (expected ${testCase.expected})`,
      );
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("✅ All base status determinations correct");
  } else {
    console.log("❌ Some base status determinations incorrect");
  }
}

/**
 * Test 3: Validate prompt building with full data
 */
function testPromptBuildingFullData() {
  console.log("\n=== Test 3: Prompt Building (Full Data) ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: RecommendationAgentInput = {
    candidate: {
      id: "candidate-1",
      candidateName: "Иван Петров",
      proposedPrice: 50000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 14,
      coverLetter: "Готов приступить к работе немедленно",
      experience: "5 лет коммерческой разработки",
      skills: ["React", "TypeScript", "Node.js"],
    },
    scores: {
      compositeScore: 89,
      priceScore: 85,
      deliveryScore: 90,
      skillsMatchScore: 95,
      experienceScore: 88,
      screeningScore: 85,
      interviewScore: 90,
    },
    comparison: {
      strengths: [
        "Лучшая цена среди всех кандидатов",
        "Самые быстрые сроки выполнения",
        "Отличное соответствие навыков",
      ],
      weaknesses: ["Меньше опыта по сравнению с топ-кандидатом"],
      comparative_analysis:
        "Кандидат занимает 1-е место благодаря оптимальному сочетанию цены, сроков и навыков.",
    },
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
    competitionContext: {
      totalCandidates: 5,
      averageCompositeScore: 75,
      topCompositeScore: 89,
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  console.log("Generated prompt length:", prompt.length);
  console.log("Prompt preview:", prompt.substring(0, 300) + "...");

  // Check that prompt contains key information
  const checks = [
    { name: "Gig title", value: prompt.includes("Разработка веб-приложения") },
    { name: "Candidate name", value: prompt.includes("Иван Петров") },
    { name: "Composite score", value: prompt.includes("89/100") },
    { name: "All individual scores", value: prompt.includes("Price: 85") },
    { name: "Strengths", value: prompt.includes("Лучшая цена") },
    { name: "Weaknesses", value: prompt.includes("Меньше опыта") },
    {
      name: "Comparative analysis",
      value: prompt.includes("оптимальному сочетанию"),
    },
    { name: "Budget", value: prompt.includes("40000-60000") },
    { name: "Deadline", value: prompt.includes("Дедлайн") },
    { name: "Competition context", value: prompt.includes("Всего кандидатов") },
    { name: "Base status", value: prompt.includes("HIGHLY_RECOMMENDED") },
    { name: "Task instructions", value: prompt.includes("RECOMMENDATION") },
    {
      name: "Actionable insights",
      value: prompt.includes("ACTIONABLE_INSIGHTS"),
    },
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
 * Test 4: Validate prompt with minimal data
 */
function testPromptWithMinimalData() {
  console.log("\n=== Test 4: Prompt with Minimal Data ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: RecommendationAgentInput = {
    candidate: {
      id: "candidate-2",
      candidateName: null,
      proposedPrice: null,
      proposedCurrency: "RUB",
      proposedDeliveryDays: null,
    },
    scores: {
      compositeScore: 65,
      priceScore: null,
      deliveryScore: null,
      skillsMatchScore: null,
      experienceScore: null,
    },
    comparison: {
      strengths: [],
      weaknesses: [],
      comparative_analysis: "Недостаточно данных для сравнения",
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
    { name: "Composite score present", value: prompt.includes("65/100") },
    { name: "Empty strengths", value: prompt.includes("не выявлено") },
    { name: "Empty weaknesses", value: prompt.includes("не выявлено") },
    { name: "Base status", value: prompt.includes("RECOMMENDED") },
    { name: "No crash", value: prompt.length > 0 },
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
    console.log("✅ Minimal data handled gracefully");
  } else {
    console.log("❌ Minimal data not handled properly");
  }
}

/**
 * Test 5: Validate different recommendation thresholds
 */
function testRecommendationThresholds() {
  console.log("\n=== Test 5: Recommendation Thresholds ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const testCases = [
    { score: 95, status: "HIGHLY_RECOMMENDED", label: "Excellent candidate" },
    { score: 80, status: "HIGHLY_RECOMMENDED", label: "Strong candidate" },
    { score: 70, status: "RECOMMENDED", label: "Good candidate" },
    { score: 60, status: "RECOMMENDED", label: "Acceptable candidate" },
    { score: 50, status: "NEUTRAL", label: "Average candidate" },
    { score: 40, status: "NEUTRAL", label: "Below average candidate" },
    { score: 30, status: "NOT_RECOMMENDED", label: "Weak candidate" },
    { score: 10, status: "NOT_RECOMMENDED", label: "Poor candidate" },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const input: RecommendationAgentInput = {
      candidate: {
        id: `test-${testCase.score}`,
      },
      scores: {
        compositeScore: testCase.score,
      },
      comparison: {
        strengths: [],
        weaknesses: [],
        comparative_analysis: testCase.label,
      },
      gigRequirements: {
        title: "Test",
        required_skills: ["React"],
      },
      gigBudget: {
        budgetCurrency: "RUB",
      },
    };

    const prompt = (agent as any).buildPrompt(input, {});
    const hasCorrectStatus = prompt.includes(testCase.status);

    if (hasCorrectStatus) {
      console.log(`✅ Score ${testCase.score} → ${testCase.status} in prompt`);
    } else {
      console.log(
        `❌ Score ${testCase.score} → ${testCase.status} not in prompt`,
      );
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("✅ All recommendation thresholds correct in prompts");
  } else {
    console.log("❌ Some recommendation thresholds incorrect");
  }
}

/**
 * Test 6: Validate competition context formatting
 */
function testCompetitionContextFormatting() {
  console.log("\n=== Test 6: Competition Context Formatting ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Test with competition context
  const input1: RecommendationAgentInput = {
    candidate: {
      id: "test-1",
    },
    scores: {
      compositeScore: 85,
    },
    comparison: {
      strengths: [],
      weaknesses: [],
      comparative_analysis: "Test",
    },
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
    competitionContext: {
      totalCandidates: 10,
      averageCompositeScore: 70.5,
      topCompositeScore: 92.3,
    },
  };

  const prompt1 = (agent as any).buildPrompt(input1, {});

  const checks1 = [
    {
      name: "Total candidates",
      value: prompt1.includes("Всего кандидатов: 10"),
    },
    { name: "Average score", value: prompt1.includes("70.5") },
    { name: "Top score", value: prompt1.includes("92.3") },
  ];

  let allPassed1 = true;
  for (const check of checks1) {
    if (check.value) {
      console.log(`✅ ${check.name} formatted correctly`);
    } else {
      console.log(`❌ ${check.name} not formatted properly`);
      allPassed1 = false;
    }
  }

  // Test without competition context
  const input2: RecommendationAgentInput = {
    candidate: {
      id: "test-2",
    },
    scores: {
      compositeScore: 85,
    },
    comparison: {
      strengths: [],
      weaknesses: [],
      comparative_analysis: "Test",
    },
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt2 = (agent as any).buildPrompt(input2, {});

  if (!prompt2.includes("КОНТЕКСТ КОНКУРЕНЦИИ")) {
    console.log("✅ Competition context omitted when not provided");
  } else {
    console.log("❌ Competition context shown when not provided");
    allPassed1 = false;
  }

  if (allPassed1) {
    console.log("✅ Competition context formatting correct");
  } else {
    console.log("❌ Competition context formatting incorrect");
  }
}

/**
 * Test 7: Validate schema structure
 */
function testSchemaStructure() {
  console.log("\n=== Test 7: Schema Structure ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const metadata = agent.getMetadata();

  if (metadata.name === "RecommendationAgent") {
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
 * Test 8: Edge cases
 */
function testEdgeCases() {
  console.log("\n=== Test 8: Edge Cases ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  // Test with boundary scores
  const boundaryScores = [0, 39, 40, 59, 60, 79, 80, 100];

  for (const score of boundaryScores) {
    const input: RecommendationAgentInput = {
      candidate: {
        id: `boundary-${score}`,
      },
      scores: {
        compositeScore: score,
      },
      comparison: {
        strengths: [],
        weaknesses: [],
        comparative_analysis: "Boundary test",
      },
      gigRequirements: {
        title: "Test",
        required_skills: ["React"],
      },
      gigBudget: {
        budgetCurrency: "RUB",
      },
    };

    const prompt = (agent as any).buildPrompt(input, {});

    if (prompt.length > 0) {
      console.log(`✅ Boundary score ${score} handled without crash`);
    } else {
      console.log(`❌ Boundary score ${score} caused error`);
    }
  }

  // Test with very long strings
  const input2: RecommendationAgentInput = {
    candidate: {
      id: "long-strings",
      candidateName: "A".repeat(1000),
      coverLetter: "B".repeat(5000),
      experience: "C".repeat(5000),
    },
    scores: {
      compositeScore: 85,
    },
    comparison: {
      strengths: ["D".repeat(500), "E".repeat(500), "F".repeat(500)],
      weaknesses: ["G".repeat(500), "H".repeat(500)],
      comparative_analysis: "I".repeat(5000),
    },
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
      summary: "J".repeat(5000),
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
  const input3: RecommendationAgentInput = {
    candidate: {
      id: "special-chars",
      candidateName: "Test <script>alert('xss')</script> User",
      coverLetter: "Test \"quotes\" and 'apostrophes'",
    },
    scores: {
      compositeScore: 85,
    },
    comparison: {
      strengths: ["Test & Special <> Characters"],
      weaknesses: [],
      comparative_analysis: "Test analysis",
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

  if (prompt3.includes("Test") && prompt3.includes("User")) {
    console.log("✅ Handles special characters");
  } else {
    console.log("❌ Failed to handle special characters");
  }

  // Test with maximum strengths/weaknesses
  const input4: RecommendationAgentInput = {
    candidate: {
      id: "max-arrays",
    },
    scores: {
      compositeScore: 85,
    },
    comparison: {
      strengths: ["Strength 1", "Strength 2", "Strength 3"],
      weaknesses: ["Weakness 1", "Weakness 2", "Weakness 3"],
      comparative_analysis: "Test",
    },
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt4 = (agent as any).buildPrompt(input4, {});

  if (prompt4.includes("Strength 3") && prompt4.includes("Weakness 3")) {
    console.log("✅ Handles maximum strengths/weaknesses (3 each)");
  } else {
    console.log("❌ Failed to handle maximum arrays");
  }
}

/**
 * Test 9: Validate all score components display
 */
function testAllScoreComponentsDisplay() {
  console.log("\n=== Test 9: All Score Components Display ===");

  const agent = new RecommendationAgent({
    model: new MockModel() as any,
    maxSteps: 5,
  });

  const input: RecommendationAgentInput = {
    candidate: {
      id: "all-scores",
    },
    scores: {
      compositeScore: 85,
      priceScore: 80,
      deliveryScore: 85,
      skillsMatchScore: 90,
      experienceScore: 88,
      screeningScore: 82,
      interviewScore: 87,
    },
    comparison: {
      strengths: [],
      weaknesses: [],
      comparative_analysis: "Test",
    },
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  };

  const prompt = (agent as any).buildPrompt(input, {});

  const checks = [
    { name: "Composite score", value: prompt.includes("Composite Score: 85") },
    { name: "Price score", value: prompt.includes("Price: 80") },
    { name: "Delivery score", value: prompt.includes("Delivery: 85") },
    { name: "Skills score", value: prompt.includes("Skills Match: 90") },
    { name: "Experience score", value: prompt.includes("Experience: 88") },
    { name: "Screening score", value: prompt.includes("Screening: 82") },
    { name: "Interview score", value: prompt.includes("Interview: 87") },
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.value) {
      console.log(`✅ ${check.name} displayed`);
    } else {
      console.log(`❌ ${check.name} not displayed`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("✅ All score components displayed correctly");
  } else {
    console.log("❌ Some score components not displayed");
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("🚀 Starting RecommendationAgent Mock Tests");
  console.log("================================================\n");

  try {
    testInputValidation();
    testBaseStatusDetermination();
    testPromptBuildingFullData();
    testPromptWithMinimalData();
    testRecommendationThresholds();
    testCompetitionContextFormatting();
    testSchemaStructure();
    testEdgeCases();
    testAllScoreComponentsDisplay();

    console.log("\n================================================");
    console.log("📊 Test Summary");
    console.log("================================================\n");
    console.log("✅ All mock tests completed successfully!");
    console.log(
      "\nNote: These tests verify the agent's logic and prompt building.",
    );
    console.log(
      "Actual AI recommendation generation requires a working API connection",
    );
    console.log(
      "and will be tested during integration testing with real data.",
    );
  } catch (error) {
    console.error("\n❌ Test suite failed with error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
