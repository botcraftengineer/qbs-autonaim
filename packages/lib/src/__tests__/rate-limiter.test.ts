import { describe, expect, test } from "bun:test";
import { checkRateLimit } from "../rate-limiter";

describe("checkRateLimit", () => {
  test("разрешает первый запрос", () => {
    const result = checkRateLimit("test-workspace-1", 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  test("блокирует после превышения лимита", () => {
    const workspaceId = "test-workspace-2";

    // Делаем 10 запросов
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(workspaceId, 10, 60_000);
      expect(result.allowed).toBe(true);
    }

    // 11-й запрос должен быть заблокирован
    const result = checkRateLimit(workspaceId, 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("сбрасывает лимит после истечения окна", async () => {
    const workspaceId = "test-workspace-3";
    const windowMs = 100; // 100ms для теста

    // Первый запрос
    const first = checkRateLimit(workspaceId, 1, windowMs);
    expect(first.allowed).toBe(true);

    // Второй запрос сразу - блокируется
    const second = checkRateLimit(workspaceId, 1, windowMs);
    expect(second.allowed).toBe(false);

    // Ждём истечения окна
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Третий запрос после истечения - разрешён
    const third = checkRateLimit(workspaceId, 1, windowMs);
    expect(third.allowed).toBe(true);
  });
});
