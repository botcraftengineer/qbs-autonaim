/**
 * Manual test script for CandidateEvaluatorAgent
 * Run with: bun run packages/ai/src/agents/recruiter/ranking/__tests__/candidate-evaluator-agent.manual-test.ts
 */

import { openai } from "@ai-sdk/openai";
import { CandidateEvaluatorAgent } from "../candidate-evaluator-agent";

// Test configuration
const TEST_MODEL = openai("gpt-4o-mini");

/**
 * Test Case 1: Complete candidate with all data
 */
async function testCompleteCandidate() {
  console.log("\n=== Test 1: Complete Candidate ===");

  const agent = new CandidateEvaluatorAgent({
    model: TEST_MODEL,
    maxSteps: 5,
  });

  const input = {
    candidate: {
      id: "test-1",
      candidateName: "Иван Петров",
      proposedPrice: 50000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 14,
      coverLetter:
        "Имею 5 лет опыта в разработке веб-приложений на React и Node.js. Готов приступить к работе немедленно.",
      experience:
        "5 лет коммерческой разработки, работал над 10+ проектами различной сложности",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
      portfolioLinks: [
        "https://github.com/user/project1",
        "https://github.com/user/project2",
      ],
      rating: "4.8/5.0",
    },
    gigRequirements: {
      title: "Разработка веб-приложения для управления задачами",
      summary:
        "Требуется разработать SPA приложение с функционалом управления задачами, пользователями и отчетами",
      required_skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      nice_to_have_skills: ["Docker", "AWS", "GraphQL"],
      tech_stack: ["React", "Node.js", "PostgreSQL"],
      experience_level: "Middle",
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    existingScores: {
      screeningScore: 85,
      interviewScore: 90,
    },
    marketContext: {
      allPrices: [45000, 50000, 55000, 60000, 70000],
      allDeliveryDays: [10, 14, 20, 25, 30],
    },
  };

  const result = await agent.execute(input, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    console.log("\n✅ Test passed: Agent returned valid scores");
    console.log("Price Score:", result.data.priceScore);
    console.log("Delivery Score:", result.data.deliveryScore);
    console.log("Skills Match Score:", result.data.skillsMatchScore);
    console.log("Experience Score:", result.data.experienceScore);
    console.log("Composite Score:", result.data.compositeScore);

    // Validate scores are in range
    const scores = [
      result.data.priceScore.score,
      result.data.deliveryScore.score,
      result.data.skillsMatchScore.score,
      result.data.experienceScore.score,
      result.data.compositeScore.score,
    ];

    const allValid = scores.every(
      (score) => score === null || (score >= 0 && score <= 100),
    );

    if (allValid) {
      console.log("✅ All scores are in valid range [0-100]");
    } else {
      console.log("❌ Some scores are out of range!");
    }

    // Check reasoning quality
    const hasReasoning = [
      result.data.priceScore.reasoning,
      result.data.deliveryScore.reasoning,
      result.data.skillsMatchScore.reasoning,
      result.data.experienceScore.reasoning,
      result.data.compositeScore.reasoning,
    ].every((r) => r && r.length > 20);

    if (hasReasoning) {
      console.log("✅ All scores have detailed reasoning");
    } else {
      console.log("❌ Some reasoning is missing or too short!");
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }

  return result;
}

/**
 * Test Case 2: Candidate with missing price data
 */
async function testMissingPriceData() {
  console.log("\n=== Test 2: Missing Price Data ===");

  const agent = new CandidateEvaluatorAgent({
    model: TEST_MODEL,
    maxSteps: 5,
  });

  const input = {
    candidate: {
      id: "test-2",
      candidateName: "Мария Сидорова",
      proposedPrice: null,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 20,
      skills: ["React", "TypeScript", "Node.js"],
      experience: "3 года опыта в веб-разработке",
    },
    gigRequirements: {
      title: "Разработка лендинга",
      required_skills: ["React", "TypeScript"],
      nice_to_have_skills: ["Node.js"],
    },
    gigBudget: {
      budgetMin: 30000,
      budgetMax: 50000,
      budgetCurrency: "RUB",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  };

  const result = await agent.execute(input, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    console.log("\n✅ Test passed: Agent handled missing price data");

    if (result.data.priceScore.score === null) {
      console.log("✅ Price score is null as expected");
      console.log("Reasoning:", result.data.priceScore.reasoning);
    } else {
      console.log("❌ Price score should be null when price is missing!");
    }

    // Other scores should still be calculated
    if (
      result.data.deliveryScore.score !== null &&
      result.data.skillsMatchScore.score !== null
    ) {
      console.log("✅ Other scores calculated despite missing price");
    } else {
      console.log("❌ Other scores should be calculated!");
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }

  return result;
}

/**
 * Test Case 3: Candidate with price above budget
 */
async function testPriceAboveBudget() {
  console.log("\n=== Test 3: Price Above Budget ===");

  const agent = new CandidateEvaluatorAgent({
    model: TEST_MODEL,
    maxSteps: 5,
  });

  const input = {
    candidate: {
      id: "test-3",
      candidateName: "Алексей Иванов",
      proposedPrice: 80000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 15,
      skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
      experience: "7 лет опыта, работал в крупных компаниях",
      portfolioLinks: ["https://portfolio.com/project1"],
      rating: "5.0/5.0",
    },
    gigRequirements: {
      title: "Разработка веб-приложения",
      required_skills: ["React", "TypeScript", "Node.js"],
      nice_to_have_skills: ["AWS", "Docker"],
      experience_level: "Senior",
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    marketContext: {
      allPrices: [45000, 50000, 55000, 60000, 80000],
      allDeliveryDays: [10, 15, 20, 25, 30],
    },
  };

  const result = await agent.execute(input, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    console.log("\n✅ Test passed: Agent evaluated expensive candidate");

    if (
      result.data.priceScore.score !== null &&
      result.data.priceScore.score < 70
    ) {
      console.log(
        "✅ Price score is lower due to being above budget:",
        result.data.priceScore.score,
      );
      console.log("Reasoning:", result.data.priceScore.reasoning);
    } else {
      console.log(
        "⚠️  Price score might not reflect budget constraint properly",
      );
    }

    // Experience and skills should be high
    if (
      result.data.experienceScore.score !== null &&
      result.data.experienceScore.score > 80
    ) {
      console.log("✅ Experience score is high as expected");
    }

    if (
      result.data.skillsMatchScore.score !== null &&
      result.data.skillsMatchScore.score > 80
    ) {
      console.log("✅ Skills match score is high as expected");
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }

  return result;
}

/**
 * Test Case 4: Candidate with unrealistic delivery time
 */
async function testUnrealisticDelivery() {
  console.log("\n=== Test 4: Unrealistic Delivery Time ===");

  const agent = new CandidateEvaluatorAgent({
    model: TEST_MODEL,
    maxSteps: 5,
  });

  const input = {
    candidate: {
      id: "test-4",
      candidateName: "Дмитрий Козлов",
      proposedPrice: 45000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 3, // Very optimistic!
      skills: ["React", "TypeScript"],
      experience: "2 года опыта",
    },
    gigRequirements: {
      title: "Разработка сложного веб-приложения с интеграциями",
      summary:
        "Требуется разработать приложение с множеством интеграций и сложной бизнес-логикой",
      required_skills: ["React", "TypeScript", "Node.js"],
      experience_level: "Middle",
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    marketContext: {
      allPrices: [40000, 45000, 50000, 55000],
      allDeliveryDays: [3, 15, 20, 25],
    },
  };

  const result = await agent.execute(input, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    console.log("\n✅ Test passed: Agent evaluated unrealistic timeline");

    if (
      result.data.deliveryScore.score !== null &&
      result.data.deliveryScore.score < 60
    ) {
      console.log(
        "✅ Delivery score is lower due to unrealistic timeline:",
        result.data.deliveryScore.score,
      );
      console.log("Reasoning:", result.data.deliveryScore.reasoning);
    } else {
      console.log(
        "⚠️  Delivery score might not reflect unrealistic timeline properly",
      );
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }

  return result;
}

/**
 * Test Case 5: Candidate with poor skills match
 */
async function testPoorSkillsMatch() {
  console.log("\n=== Test 5: Poor Skills Match ===");

  const agent = new CandidateEvaluatorAgent({
    model: TEST_MODEL,
    maxSteps: 5,
  });

  const input = {
    candidate: {
      id: "test-5",
      candidateName: "Ольга Смирнова",
      proposedPrice: 45000,
      proposedCurrency: "RUB",
      proposedDeliveryDays: 20,
      skills: ["Python", "Django"], // Wrong tech stack!
      experience: "4 года опыта в backend разработке",
    },
    gigRequirements: {
      title: "Разработка React приложения",
      required_skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      nice_to_have_skills: ["Docker", "AWS"],
      experience_level: "Middle",
    },
    gigBudget: {
      budgetMin: 40000,
      budgetMax: 60000,
      budgetCurrency: "RUB",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  };

  const result = await agent.execute(input, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    console.log("\n✅ Test passed: Agent evaluated poor skills match");

    if (
      result.data.skillsMatchScore.score !== null &&
      result.data.skillsMatchScore.score < 40
    ) {
      console.log(
        "✅ Skills match score is low as expected:",
        result.data.skillsMatchScore.score,
      );
      console.log("Reasoning:", result.data.skillsMatchScore.reasoning);
    } else {
      console.log(
        "⚠️  Skills match score should be lower for poor match:",
        result.data.skillsMatchScore.score,
      );
    }

    // Composite score should also be affected
    if (
      result.data.compositeScore.score !== null &&
      result.data.compositeScore.score < 60
    ) {
      console.log("✅ Composite score reflects poor skills match");
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }

  return result;
}

/**
 * Test Case 6: Minimal data candidate
 */
async function testMinimalData() {
  console.log("\n=== Test 6: Minimal Data ===");

  const agent = new CandidateEvaluatorAgent({
    model: TEST_MODEL,
    maxSteps: 5,
  });

  const input = {
    candidate: {
      id: "test-6",
      candidateName: null,
      proposedPrice: null,
      proposedDeliveryDays: null,
      skills: null,
      experience: null,
    },
    gigRequirements: {
      title: "Разработка приложения",
      required_skills: ["React"],
    },
    gigBudget: {
      budgetMin: null,
      budgetMax: null,
      budgetCurrency: "RUB",
      deadline: null,
    },
  };

  const result = await agent.execute(input, {});

  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    console.log("\n✅ Test passed: Agent handled minimal data");

    // Most scores should be null
    const nullScores = [
      result.data.priceScore.score,
      result.data.deliveryScore.score,
      result.data.skillsMatchScore.score,
      result.data.experienceScore.score,
    ].filter((s) => s === null).length;

    console.log(
      `${nullScores}/4 scores are null (expected due to missing data)`,
    );

    // All should have reasoning explaining why
    const allHaveReasoning = [
      result.data.priceScore.reasoning,
      result.data.deliveryScore.reasoning,
      result.data.skillsMatchScore.reasoning,
      result.data.experienceScore.reasoning,
    ].every((r) => r && r.length > 10);

    if (allHaveReasoning) {
      console.log("✅ All scores have reasoning explaining missing data");
    } else {
      console.log("❌ Some reasoning is missing!");
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }

  return result;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("🚀 Starting CandidateEvaluatorAgent Manual Tests");
  console.log("================================================\n");

  const results = [];

  try {
    results.push(await testCompleteCandidate());
    results.push(await testMissingPriceData());
    results.push(await testPriceAboveBudget());
    results.push(await testUnrealisticDelivery());
    results.push(await testPoorSkillsMatch());
    results.push(await testMinimalData());

    console.log("\n================================================");
    console.log("📊 Test Summary");
    console.log("================================================\n");

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    console.log(`✅ Passed: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);

    if (successCount === totalCount) {
      console.log("\n🎉 All tests passed!");
    } else {
      console.log("\n⚠️  Some tests failed. Review the output above.");
    }
  } catch (error) {
    console.error("\n❌ Test suite failed with error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
