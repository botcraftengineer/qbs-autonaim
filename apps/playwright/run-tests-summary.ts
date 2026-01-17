#!/usr/bin/env bun
import { $ } from "bun";

console.log("🧪 Running Playwright tests summary...\n");

try {
  // Run tests and capture output
  const result = await $`bun with-env playwright test --reporter=json`.quiet();

  const output = result.stdout.toString();
  const jsonMatch = output.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const testResults = JSON.parse(jsonMatch[0]);

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;

    const failedTests: string[] = [];

    function processSpecs(specs: any[]) {
      for (const spec of specs) {
        if (spec.tests) {
          for (const test of spec.tests) {
            if (test.status === "expected") passed++;
            else if (test.status === "skipped") skipped++;
            else if (test.status === "unexpected") {
              failed++;
              failedTests.push(`${spec.file}:${spec.line} › ${spec.title}`);
            } else if (test.status === "flaky") flaky++;
          }
        }
        if (spec.specs) {
          processSpecs(spec.specs);
        }
      }
    }

    function processSuites(suites: any[]) {
      for (const suite of suites) {
        if (suite.specs) {
          processSpecs(suite.specs);
        }
        if (suite.suites) {
          processSuites(suite.suites);
        }
      }
    }

    if (testResults.suites) {
      processSuites(testResults.suites);
    }

    console.log("📊 Test Results Summary:");
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`⚠️  Flaky: ${flaky}`);
    console.log(`📝 Total: ${passed + failed + skipped + flaky}\n`);

    if (failedTests.length > 0) {
      console.log("❌ Failed tests:");
      for (const test of failedTests) {
        console.log(`  - ${test}`);
      }
    }
  } else {
    console.error("Could not parse test results");
  }
} catch (error) {
  console.error("Error running tests:", error);
  process.exit(1);
}
