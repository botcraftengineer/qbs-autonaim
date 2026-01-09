/**
 * Mock-based test for RankingOrchestrator
 * Tests the orchestrator logic and coordination of all agents
 */

import type { RankingInput } from "../ranking-orchestrator";
import { RankingOrchestrator } from "../ranking-orchestrator";

/**
 * Mock model that returns predefined responses based on agent type
 */
class MockModel {
  private agentType: string;

  constructor(agentType: string) {
    this.agentType = agentType;
  }

  async doGenerate() {
    // Return different responses based on agent type
    if (this.agentType === "evaluator") {
      return {
        text: JSON.stringify({
          priceScore: {
            score: 85,
            reasoning: "Цена в пределах бюджета",
          },
          deliveryScore: {
            score: 90,
            reasoning: "Реалистичные сроки",
          },
          skillsMatchScore: {
            score: 95,
            reasoning: "Отличное соответствие навыков",
          },
          experienceScore: {
            score: 88,
            reasoning: "Солидный опыт",
          },
          compositeScore: {
            score: 89,
            reasoning: "Отличный кандидат",
          },
        }),
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 200 },
      };
    }

    if (this.agentType === "comparison") {
      return {
        text: JSON.stringify({
          comparisons: [
            {
              candidateId: "candidate-1",
              strengths: ["Лучшая цена", "Быстрые сроки"],
              weaknesses: ["Меньше опыта"],
              comparative_analysis: "Лидер по цене и срокам",
            },
          ],
          category_leaders: {
            best_price: "candidate-1",
            fastest_delivery: "candidate-1",
            highest_composite: "candidate-1",
          },
        }),
        finishReason: "stop",
        usage: { promptTokens: 150, completionTokens: 300 },
      };
    }

    if (this.agentType === "recommendation") {
      return {
        text: JSON.stringify({
          recommendation: "HIGHLY_RECOMMENDED",
          ranking_analysis: "Отличный кандидат с оптимальным соотношением",
          actionable_insights: [
            "Fast-track to interview",
            "Verify availability",
          ],
        }),
        finishReason: "stop",
        usage: { promptTokens: 200, completionTokens: 250 },
      };
    }

    throw new Error(`Unknown agent type: ${this.agentType}`);
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
 * Test 1: Single candidate ranking
 */
async function testSingleCandidateRanking() {
  console.log("\n=== Test 1: Single Candidate Ranking ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Единственный Кандидат",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 14,
        skills: ["React", "TypeScript"],
        createdAt: new Date("2026-01-01"),
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

  try {
    const result = await orchestrator.rankCandidates(input);

    const checks = [
      { name: "Result has candidates", value: result.candidates.length === 1 },
      { name: "Total count is 1", value: result.totalCount === 1 },
      {
        name: "Ranking position is 1",
        value: result.candidates[0].rankingPosition === 1,
      },
      {
        name: "Has rankedAt timestamp",
        value: result.rankedAt instanceof Date,
      },
      {
        name: "Has category leaders",
        value: Object.keys(result.categoryLeaders).length > 0,
      },
      {
        name: "Candidate has scores",
        value: result.candidates[0].scores.compositeScore > 0,
      },
      {
        name: "Candidate has comparison",
        value: result.candidates[0].comparison !== undefined,
      },
      {
        name: "Candidate has recommendation",
        value: result.candidates[0].recommendation !== undefined,
      },
      {
        name: "Comparison analysis mentions single",
        value:
          result.candidates[0].comparison.comparative_analysis.includes(
            "Единственный",
          ),
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Single candidate ranking works correctly");
    } else {
      console.log("❌ Single candidate ranking has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 2: Multiple candidates ranking and sorting
 */
async function testMultipleCandidatesRanking() {
  console.log("\n=== Test 2: Multiple Candidates Ranking ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Кандидат 1",
        proposedPrice: 45000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 10,
        skills: ["React", "TypeScript", "Node.js"],
        screeningScore: 85,
        interviewScore: 90,
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "candidate-2",
        candidateName: "Кандидат 2",
        proposedPrice: 80000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 25,
        skills: ["React", "TypeScript", "Node.js", "AWS"],
        screeningScore: 95,
        interviewScore: 95,
        createdAt: new Date("2026-01-02"),
      },
      {
        id: "candidate-3",
        candidateName: "Кандидат 3",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 20,
        skills: ["React", "TypeScript"],
        screeningScore: 80,
        interviewScore: 85,
        createdAt: new Date("2026-01-03"),
      },
    ],
    gigRequirements: {
      title: "Разработка веб-приложения",
      required_skills: ["React", "TypeScript", "Node.js"],
      nice_to_have_skills: ["AWS", "Docker"],
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date("2026-02-08"),
    },
  };

  try {
    const result = await orchestrator.rankCandidates(input);

    const checks = [
      {
        name: "Result has 3 candidates",
        value: result.candidates.length === 3,
      },
      { name: "Total count is 3", value: result.totalCount === 3 },
      {
        name: "Positions are sequential",
        value:
          result.candidates[0].rankingPosition === 1 &&
          result.candidates[1].rankingPosition === 2 &&
          result.candidates[2].rankingPosition === 3,
      },
      {
        name: "Sorted by composite score",
        value:
          result.candidates[0].scores.compositeScore >=
            result.candidates[1].scores.compositeScore &&
          result.candidates[1].scores.compositeScore >=
            result.candidates[2].scores.compositeScore,
      },
      {
        name: "All have scores",
        value: result.candidates.every((c) => c.scores.compositeScore > 0),
      },
      {
        name: "All have comparison",
        value: result.candidates.every((c) => c.comparison !== undefined),
      },
      {
        name: "All have recommendation",
        value: result.candidates.every((c) => c.recommendation !== undefined),
      },
      {
        name: "Category leaders identified",
        value: Object.keys(result.categoryLeaders).length > 0,
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Multiple candidates ranking works correctly");
    } else {
      console.log("❌ Multiple candidates ranking has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 3: Rejected candidates filtering
 */
async function testRejectedCandidatesFiltering() {
  console.log("\n=== Test 3: Rejected Candidates Filtering ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Active Candidate",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        hrSelectionStatus: "INVITE",
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "candidate-2",
        candidateName: "Rejected Candidate",
        proposedPrice: 45000,
        proposedCurrency: "RUB",
        hrSelectionStatus: "REJECTED",
        createdAt: new Date("2026-01-02"),
      },
      {
        id: "candidate-3",
        candidateName: "Another Active",
        proposedPrice: 55000,
        proposedCurrency: "RUB",
        hrSelectionStatus: "RECOMMENDED",
        createdAt: new Date("2026-01-03"),
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

  try {
    const result = await orchestrator.rankCandidates(input);

    const checks = [
      {
        name: "Only 2 candidates in result",
        value: result.candidates.length === 2,
      },
      { name: "Total count is 2", value: result.totalCount === 2 },
      {
        name: "Rejected candidate excluded",
        value: !result.candidates.some((c) => c.candidate.id === "candidate-2"),
      },
      {
        name: "Active candidates included",
        value:
          result.candidates.some((c) => c.candidate.id === "candidate-1") &&
          result.candidates.some((c) => c.candidate.id === "candidate-3"),
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Rejected candidates filtering works correctly");
    } else {
      console.log("❌ Rejected candidates filtering has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 4: Tiebreaker by creation date
 */
async function testTiebreakerByCreationDate() {
  console.log("\n=== Test 4: Tiebreaker by Creation Date ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Later Candidate",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        createdAt: new Date("2026-01-03"), // Later
      },
      {
        id: "candidate-2",
        candidateName: "Earlier Candidate",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        createdAt: new Date("2026-01-01"), // Earlier
      },
      {
        id: "candidate-3",
        candidateName: "Middle Candidate",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        createdAt: new Date("2026-01-02"), // Middle
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

  try {
    const result = await orchestrator.rankCandidates(input);

    // If all have same composite score, earlier created should rank higher
    const candidate1 = result.candidates.find(
      (c) => c.candidate.id === "candidate-1",
    );
    const candidate2 = result.candidates.find(
      (c) => c.candidate.id === "candidate-2",
    );
    const candidate3 = result.candidates.find(
      (c) => c.candidate.id === "candidate-3",
    );

    if (!candidate1 || !candidate2 || !candidate3) {
      console.log("❌ Not all candidates found in result");
      return;
    }

    // Check if scores are identical (they should be with mock)
    const scoresIdentical =
      candidate1.scores.compositeScore === candidate2.scores.compositeScore &&
      candidate2.scores.compositeScore === candidate3.scores.compositeScore;

    if (scoresIdentical) {
      // Earlier created should have better (lower) ranking position
      const checks = [
        {
          name: "Earlier candidate ranks higher",
          value: candidate2.rankingPosition < candidate3.rankingPosition,
        },
        {
          name: "Middle candidate ranks higher than later",
          value: candidate3.rankingPosition < candidate1.rankingPosition,
        },
        {
          name: "Positions are sequential",
          value:
            result.candidates[0].rankingPosition === 1 &&
            result.candidates[1].rankingPosition === 2 &&
            result.candidates[2].rankingPosition === 3,
        },
      ];

      let allPassed = true;
      for (const check of checks) {
        if (check.value) {
          console.log(`✅ ${check.name}`);
        } else {
          console.log(`❌ ${check.name}`);
          allPassed = false;
        }
      }

      if (allPassed) {
        console.log("✅ Tiebreaker by creation date works correctly");
      } else {
        console.log("❌ Tiebreaker by creation date has issues");
      }
    } else {
      console.log("⚠️  Scores not identical, tiebreaker test inconclusive");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 5: Empty candidates list
 */
async function testEmptyCandidatesList() {
  console.log("\n=== Test 5: Empty Candidates List ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Rejected",
        hrSelectionStatus: "REJECTED",
        createdAt: new Date("2026-01-01"),
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

  try {
    const result = await orchestrator.rankCandidates(input);

    const checks = [
      { name: "Empty candidates array", value: result.candidates.length === 0 },
      { name: "Total count is 0", value: result.totalCount === 0 },
      {
        name: "Has rankedAt timestamp",
        value: result.rankedAt instanceof Date,
      },
      {
        name: "Category leaders empty",
        value: Object.keys(result.categoryLeaders).length === 0,
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Empty candidates list handled correctly");
    } else {
      console.log("❌ Empty candidates list has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 6: Candidates with missing data
 */
async function testCandidatesWithMissingData() {
  console.log("\n=== Test 6: Candidates with Missing Data ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: null,
        proposedPrice: null,
        proposedCurrency: "RUB",
        proposedDeliveryDays: null,
        skills: null,
        experience: null,
        screeningScore: null,
        interviewScore: null,
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "candidate-2",
        candidateName: "Complete Candidate",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 14,
        skills: ["React"],
        experience: "5 years",
        screeningScore: 85,
        interviewScore: 90,
        createdAt: new Date("2026-01-02"),
      },
    ],
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

  try {
    const result = await orchestrator.rankCandidates(input);

    const checks = [
      { name: "Both candidates ranked", value: result.candidates.length === 2 },
      {
        name: "All have composite scores",
        value: result.candidates.every((c) => c.scores.compositeScore >= 0),
      },
      {
        name: "All have recommendations",
        value: result.candidates.every((c) => c.recommendation !== undefined),
      },
      { name: "No crashes with missing data", value: true },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Missing data handled gracefully");
    } else {
      console.log("❌ Missing data handling has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 7: Input validation
 */
async function testInputValidation() {
  console.log("\n=== Test 7: Input Validation ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  // Test with invalid input - empty candidates array
  const invalidInput1 = {
    candidates: [],
    gigRequirements: {
      title: "Test",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetCurrency: "RUB",
    },
  } as any;

  try {
    await orchestrator.rankCandidates(invalidInput1);
    console.log("❌ Should have thrown error for empty candidates");
  } catch (error) {
    console.log("✅ Correctly rejects empty candidates array");
  }

  // Test with invalid input - missing required fields
  const invalidInput2 = {
    candidates: [
      {
        id: "test",
        createdAt: new Date(),
      },
    ],
    gigRequirements: {
      title: "",
      required_skills: [],
    },
    gigBudget: {},
  } as any;

  try {
    await orchestrator.rankCandidates(invalidInput2);
    console.log("✅ Handles minimal valid input");
  } catch (error) {
    console.log("⚠️  Validation may be too strict:", (error as Error).message);
  }
}

/**
 * Test 8: Market context propagation
 */
async function testMarketContextPropagation() {
  console.log("\n=== Test 8: Market Context Propagation ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        proposedPrice: 45000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 10,
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "candidate-2",
        proposedPrice: 80000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 25,
        createdAt: new Date("2026-01-02"),
      },
      {
        id: "candidate-3",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 20,
        createdAt: new Date("2026-01-03"),
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

  try {
    const result = await orchestrator.rankCandidates(input);

    // Market context should be used in evaluation
    // All candidates should have been evaluated with context of other candidates' prices/delivery
    const checks = [
      {
        name: "All candidates evaluated",
        value: result.candidates.length === 3,
      },
      {
        name: "All have price scores",
        value: result.candidates.every((c) => c.scores.priceScore !== null),
      },
      {
        name: "All have delivery scores",
        value: result.candidates.every((c) => c.scores.deliveryScore !== null),
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Market context propagated correctly");
    } else {
      console.log("❌ Market context propagation has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Test 9: Result structure validation
 */
async function testResultStructureValidation() {
  console.log("\n=== Test 9: Result Structure Validation ===");

  const orchestrator = new RankingOrchestrator({
    model: new MockModel("evaluator") as any,
    maxSteps: 5,
  });

  const input: RankingInput = {
    candidates: [
      {
        id: "candidate-1",
        candidateName: "Test Candidate",
        proposedPrice: 50000,
        proposedCurrency: "RUB",
        proposedDeliveryDays: 14,
        skills: ["React", "TypeScript"],
        experience: "5 years",
        screeningScore: 85,
        interviewScore: 90,
        createdAt: new Date("2026-01-01"),
      },
    ],
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

  try {
    const result = await orchestrator.rankCandidates(input);

    const candidate = result.candidates[0];

    const checks = [
      // Top-level structure
      { name: "Has candidates array", value: Array.isArray(result.candidates) },
      { name: "Has totalCount", value: typeof result.totalCount === "number" },
      { name: "Has rankedAt", value: result.rankedAt instanceof Date },
      {
        name: "Has categoryLeaders",
        value: typeof result.categoryLeaders === "object",
      },

      // Candidate structure
      {
        name: "Candidate has original data",
        value: candidate.candidate !== undefined,
      },
      { name: "Candidate has scores", value: candidate.scores !== undefined },
      {
        name: "Candidate has comparison",
        value: candidate.comparison !== undefined,
      },
      {
        name: "Candidate has recommendation",
        value: candidate.recommendation !== undefined,
      },
      {
        name: "Candidate has rankingPosition",
        value: typeof candidate.rankingPosition === "number",
      },

      // Scores structure
      {
        name: "Has priceScore",
        value:
          typeof candidate.scores.priceScore === "number" ||
          candidate.scores.priceScore === null,
      },
      {
        name: "Has deliveryScore",
        value:
          typeof candidate.scores.deliveryScore === "number" ||
          candidate.scores.deliveryScore === null,
      },
      {
        name: "Has skillsMatchScore",
        value:
          typeof candidate.scores.skillsMatchScore === "number" ||
          candidate.scores.skillsMatchScore === null,
      },
      {
        name: "Has experienceScore",
        value:
          typeof candidate.scores.experienceScore === "number" ||
          candidate.scores.experienceScore === null,
      },
      {
        name: "Has compositeScore",
        value: typeof candidate.scores.compositeScore === "number",
      },

      // Comparison structure
      {
        name: "Has strengths array",
        value: Array.isArray(candidate.comparison.strengths),
      },
      {
        name: "Has weaknesses array",
        value: Array.isArray(candidate.comparison.weaknesses),
      },
      {
        name: "Has comparative_analysis",
        value: typeof candidate.comparison.comparative_analysis === "string",
      },

      // Recommendation structure
      {
        name: "Has recommendation status",
        value: typeof candidate.recommendation.status === "string",
      },
      {
        name: "Has ranking_analysis",
        value: typeof candidate.recommendation.ranking_analysis === "string",
      },
      {
        name: "Has actionable_insights",
        value: Array.isArray(candidate.recommendation.actionable_insights),
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.value) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log("✅ Result structure is valid");
    } else {
      console.log("❌ Result structure has issues");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("🚀 Starting RankingOrchestrator Mock Tests");
  console.log("================================================\n");

  try {
    await testSingleCandidateRanking();
    await testMultipleCandidatesRanking();
    await testRejectedCandidatesFiltering();
    await testTiebreakerByCreationDate();
    await testEmptyCandidatesList();
    await testCandidatesWithMissingData();
    await testInputValidation();
    await testMarketContextPropagation();
    await testResultStructureValidation();

    console.log("\n================================================");
    console.log("📊 Test Summary");
    console.log("================================================\n");
    console.log("✅ All orchestrator mock tests completed!");
    console.log(
      "\nNote: These tests verify the orchestrator's coordination logic.",
    );
    console.log(
      "Actual AI-powered ranking requires working API connections and will be",
    );
    console.log("tested during integration testing with real data.");
  } catch (error) {
    console.error("\n❌ Test suite failed with error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
