/**
 * Example demonstrating rule validation in RuleEngine
 *
 * The addRule method now validates:
 * 1. Condition field/operator/value compatibility
 * 2. Action-specific required parameters
 * 3. Composite conditions recursively
 */

import { RuleEngine } from "./rule-engine";

// Example 1: Invalid operator for numeric field
try {
  const engine = new RuleEngine();
  const invalidRule = RuleEngine.createRule({
    workspaceId: "workspace-1",
    name: "Invalid Operator Rule",
    description: "This will fail - contains operator on numeric field",
    condition: {
      field: "fitScore",
      operator: "contains", // ❌ Invalid for numeric field
      value: 80,
    },
    action: { type: "invite" },
    autonomyLevel: "advise",
    priority: 1,
    enabled: true,
  });
  engine.addRule(invalidRule);
} catch (error) {
  console.log("✓ Caught error:", (error as Error).message);
  // Output: Field "fitScore" requires a numeric operator (>, <, =, >=, <=, !=), got "contains"
}

// Example 2: Missing required action parameter
try {
  const engine = new RuleEngine();
  const invalidRule = RuleEngine.createRule({
    workspaceId: "workspace-1",
    name: "Missing Tag Param",
    description: "This will fail - tag action without tag param",
    condition: {
      field: "fitScore",
      operator: ">",
      value: 90,
    },
    action: {
      type: "tag",
      // ❌ Missing params.tag
    },
    autonomyLevel: "autonomous",
    priority: 1,
    enabled: true,
  });
  engine.addRule(invalidRule);
} catch (error) {
  console.log("✓ Caught error:", (error as Error).message);
  // Output: Action type "tag" requires params.tag to be specified
}

// Example 3: Valid rule passes validation
try {
  const engine = new RuleEngine();
  const validRule = RuleEngine.createRule({
    workspaceId: "workspace-1",
    name: "High Score Auto-Invite",
    description: "Automatically invite candidates with fitScore > 85",
    condition: {
      field: "fitScore",
      operator: ">",
      value: 85,
    },
    action: {
      type: "invite",
      params: {
        messageTemplate:
          "Congratulations! We'd like to invite you for an interview.",
      },
    },
    autonomyLevel: "autonomous",
    priority: 1,
    enabled: true,
  });
  engine.addRule(validRule);
  console.log("✓ Valid rule added successfully:", validRule.name);
} catch (error) {
  console.log("✗ Unexpected error:", (error as Error).message);
}

// Example 4: Complex composite condition validation
try {
  const engine = new RuleEngine();
  const complexRule = RuleEngine.createRule({
    workspaceId: "workspace-1",
    name: "Senior High-Fit Candidate",
    description: "Notify recruiter for senior candidates with high fit",
    condition: RuleEngine.and(
      { field: "fitScore", operator: ">=", value: 90 },
      { field: "experience", operator: ">=", value: 5 },
      RuleEngine.or(
        { field: "availability", operator: "=", value: "immediate" },
        { field: "availability", operator: "=", value: "2_weeks" },
      ),
    ),
    action: {
      type: "notify",
      params: {
        notificationChannel: "telegram",
      },
    },
    autonomyLevel: "confirm",
    priority: 10,
    enabled: true,
  });
  engine.addRule(complexRule);
  console.log("✓ Complex rule added successfully:", complexRule.name);
} catch (error) {
  console.log("✗ Unexpected error:", (error as Error).message);
}
