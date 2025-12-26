/**
 * Глобальная настройка для Playwright тестов
 * Выполняется один раз перед всеми тестами
 */
export default async function globalSetup() {
  console.log("🚀 Starting Playwright tests with parallel execution");
  console.log(
    `📊 Workers: ${process.env.CI ? "2 (CI)" : "75% of CPU cores (local)"}`,
  );
  console.log("✅ Test isolation: Each test gets its own user via API");
}
