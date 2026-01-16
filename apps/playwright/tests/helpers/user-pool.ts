import type { Page } from "@playwright/test";

/**
 * Пул тестовых пользователей для параллельного выполнения тестов
 * Каждый воркер получает своего пользователя из пула
 */

interface TestUser {
  email: string;
  password: string;
  name: string;
  id?: string;
  inUse: boolean;
}

// Пул из 10 предсозданных пользователей
const USER_POOL: TestUser[] = [
  {
    email: "test-user-1@playwright.test",
    password: "TestPassword123!",
    name: "Test User 1",
    inUse: false,
  },
  {
    email: "test-user-2@playwright.test",
    password: "TestPassword123!",
    name: "Test User 2",
    inUse: false,
  },
  {
    email: "test-user-3@playwright.test",
    password: "TestPassword123!",
    name: "Test User 3",
    inUse: false,
  },
  {
    email: "test-user-4@playwright.test",
    password: "TestPassword123!",
    name: "Test User 4",
    inUse: false,
  },
  {
    email: "test-user-5@playwright.test",
    password: "TestPassword123!",
    name: "Test User 5",
    inUse: false,
  },
  {
    email: "test-user-6@playwright.test",
    password: "TestPassword123!",
    name: "Test User 6",
    inUse: false,
  },
  {
    email: "test-user-7@playwright.test",
    password: "TestPassword123!",
    name: "Test User 7",
    inUse: false,
  },
  {
    email: "test-user-8@playwright.test",
    password: "TestPassword123!",
    name: "Test User 8",
    inUse: false,
  },
  {
    email: "test-user-9@playwright.test",
    password: "TestPassword123!",
    name: "Test User 9",
    inUse: false,
  },
  {
    email: "test-user-10@playwright.test",
    password: "TestPassword123!",
    name: "Test User 10",
    inUse: false,
  },
];

/**
 * Получить свободного пользователя из пула
 */
export function acquireUser(): TestUser {
  const user = USER_POOL.find((u) => !u.inUse);
  if (!user) {
    throw new Error("No available users in pool. Increase pool size.");
  }
  user.inUse = true;
  return user;
}

/**
 * Освободить пользователя обратно в пул
 */
export function releaseUser(email: string): void {
  const user = USER_POOL.find((u) => u.email === email);
  if (user) {
    user.inUse = false;
  }
}

/**
 * Получить количество свободных пользователей
 */
export function getAvailableUsersCount(): number {
  return USER_POOL.filter((u) => !u.inUse).length;
}

/**
 * Авторизация с использованием пользователя из пула
 */
export async function loginWithPoolUser(page: Page): Promise<TestUser> {
  const user = acquireUser();

  // Mock авторизации для быстрого входа
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль").fill(user.password);
  await page.getByRole("button", { name: "Войти" }).click();

  // Ждем редиректа на дашборд
  await page.waitForURL("**/dashboard", { timeout: 10000 });

  return user;
}

/**
 * Очистка данных пользователя после теста
 */
export async function cleanupUserData(
  page: Page,
  user: TestUser,
): Promise<void> {
  // Здесь можно добавить логику очистки данных пользователя
  // Например, удаление созданных организаций, воркспейсов и т.д.

  // Выход из системы
  await page.goto("/auth/signout");

  // Освобождаем пользователя обратно в пул
  releaseUser(user.email);
}
