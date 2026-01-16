/**
 * Глобальная настройка для Playwright тестов
 * Выполняется один раз перед всеми тестами
 */
export default async function globalSetup() {
  console.log("🚀 Starting Playwright tests with optimizations");
  console.log(
    `📊 Workers: ${process.env.CI ? "6 (CI)" : "1 (local)"} - parallel execution`,
  );
  console.log("✅ Test isolation: User pool with 10 pre-configured users");
  console.log("⚡ Fast UI tests: ~30s timeout");
  console.log("🐌 Slow E2E tests: ~90s timeout");
  console.log("🎭 Mock API: Enabled for auth-dependent tests");
}
