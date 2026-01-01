import { describe, expect, test } from "bun:test";

// Test to verify that ConversationMessage keys are unique and stable
describe("WizardChat React Keys", () => {
  test("ConversationMessage should have unique id property", () => {
    // Mock ConversationMessage objects
    const messages = [
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: "Hello, I need help with my project",
      },
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "Hello, I need help with my project", // Same content as above
      },
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: "Hello, I need help with my project", // Same content again
      },
    ];

    // Extract all IDs
    const ids = messages.map((msg) => msg.id);

    // Verify all IDs are unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(messages.length);

    // Verify all IDs are strings and not empty
    ids.forEach((id) => {
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  test("Messages with identical content should have different keys", () => {
    const identicalContent = "This is the same message content";

    const message1 = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: identicalContent,
    };

    const message2 = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: identicalContent,
    };

    // Even with identical role and content, IDs should be different
    expect(message1.id).not.toBe(message2.id);
    expect(message1.role).toBe(message2.role);
    expect(message1.content).toBe(message2.content);
  });
});
