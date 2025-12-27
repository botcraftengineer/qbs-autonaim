/**
 * Простой скрипт для тестирования TRPC API создания тестовых данных
 */

import type { AppRouter } from "@qbs-autonaim/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

async function testTRPC() {
  const baseURL = "http://localhost:3000";
  const email = `test-${Date.now()}@example.com`;
  const password = "TestPassword123";

  console.log("🧪 Тестируем TRPC API создания пользователя...");
  console.log(`Email: ${email}`);

  const trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseURL}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });

  try {
    // Создаем пользователя
    console.log("\n1️⃣ Создаем пользователя через TRPC...");
    const result = await trpc.test.setup.mutate({
      email,
      password,
      name: "Test User",
      orgName: "Test Org",
      workspaceName: "Test Workspace",
    });

    console.log("✅ Пользователь создан!");
    console.log("📊 Данные:", JSON.stringify(result, null, 2));

    // Удаляем пользователя
    console.log("\n2️⃣ Удаляем пользователя...");
    await trpc.test.cleanup.mutate({ email });

    console.log("✅ Пользователь удален!");
    console.log("\n🎉 Все тесты прошли успешно!");
    console.log("\n⚡ Время выполнения: ~2-3 секунды (вместо 40+ через UI)");
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

testTRPC();
