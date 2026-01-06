import { describe, expect, test } from "bun:test";
import { RuleEngine } from "./rule-engine";

describe("RuleEngine validation", () => {
  test("should reject rule with invalid numeric operator on numeric field", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test invalid operator",
      condition: {
        field: "fitScore",
        operator: "contains", // Invalid for numeric field
        value: 80,
      },
      action: {
        type: "invite",
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      'Field "fitScore" requires a numeric operator',
    );
  });

  test("should reject rule with non-numeric value on numeric field", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test invalid value type",
      condition: {
        field: "fitScore",
        operator: ">",
        value: "80" as unknown as number, // Invalid type
      },
      action: {
        type: "invite",
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      'Field "fitScore" requires a numeric value',
    );
  });

  test("should reject rule with fitScore out of range", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test out of range value",
      condition: {
        field: "fitScore",
        operator: ">",
        value: 150, // Out of range (0-100)
      },
      action: {
        type: "invite",
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      'Field "fitScore" must be between 0 and 100',
    );
  });

  test("should reject tag action without tag param", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test missing tag param",
      condition: {
        field: "fitScore",
        operator: ">",
        value: 80,
      },
      action: {
        type: "tag",
        // Missing params.tag
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      'Action type "tag" requires params.tag',
    );
  });

  test("should reject notify action without notificationChannel", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test missing notification channel",
      condition: {
        field: "fitScore",
        operator: ">",
        value: 80,
      },
      action: {
        type: "notify",
        // Missing params.notificationChannel
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      'Action type "notify" requires params.notificationChannel',
    );
  });

  test("should reject notify action with invalid notificationChannel", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test invalid notification channel",
      condition: {
        field: "fitScore",
        operator: ">",
        value: 80,
      },
      action: {
        type: "notify",
        params: {
          notificationChannel: "slack" as "email", // Invalid channel
        },
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      "params.notificationChannel to be one of: email, telegram, sms",
    );
  });

  test("should reject composite condition with no conditions", () => {
    const engine = new RuleEngine();

    const invalidRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Invalid Rule",
      description: "Test empty composite condition",
      condition: {
        type: "AND",
        conditions: [], // Empty
      },
      action: {
        type: "invite",
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(invalidRule)).toThrow(
      "must have at least one condition",
    );
  });

  test("should accept valid rule", () => {
    const engine = new RuleEngine();

    const validRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Valid Rule",
      description: "Test valid rule",
      condition: {
        field: "fitScore",
        operator: ">",
        value: 80,
      },
      action: {
        type: "invite",
        params: {
          messageTemplate: "You're invited!",
        },
      },
      autonomyLevel: "advise",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(validRule)).not.toThrow();
    expect(engine.getRule(validRule.id)).toBeDefined();
  });

  test("should accept valid tag action", () => {
    const engine = new RuleEngine();

    const validRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Valid Tag Rule",
      description: "Test valid tag action",
      condition: {
        field: "fitScore",
        operator: ">=",
        value: 90,
      },
      action: {
        type: "tag",
        params: {
          tag: "high-potential",
        },
      },
      autonomyLevel: "autonomous",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(validRule)).not.toThrow();
  });

  test("should accept valid notify action", () => {
    const engine = new RuleEngine();

    const validRule = RuleEngine.createRule({
      workspaceId: "test-workspace",
      name: "Valid Notify Rule",
      description: "Test valid notify action",
      condition: {
        field: "fitScore",
        operator: ">=",
        value: 95,
      },
      action: {
        type: "notify",
        params: {
          notificationChannel: "telegram",
        },
      },
      autonomyLevel: "confirm",
      priority: 1,
      enabled: true,
    });

    expect(() => engine.addRule(validRule)).not.toThrow();
  });
});
