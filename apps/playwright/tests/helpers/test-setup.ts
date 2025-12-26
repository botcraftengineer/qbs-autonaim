import type { Page } from "@playwright/test";
import type { AppRouter } from "@qbs-autonaim/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export interface TestUser {
  email: string;
  password: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  dashboardUrl: string;
}

/**
 * Создание TRPC клиента для тестов
 */
function createTestTRPCClient(baseURL: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseURL}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
}

/**
 * Быстрое создание тестового пользователя с организацией и workspace через TRPC
 * Ускоряет тесты в 10+ раз по сравнению с UI онбордингом
 */
export async function createTestUser(
  baseURL = "http://localhost:3000",
  options?: {
    email?: string;
    password?: string;
    name?: string;
    orgName?: string;
    workspaceName?: string;
  },
): Promise<TestUser> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  const email = options?.email || `test-${timestamp}-${random}@example.com`;
  const password = options?.password || "TestPassword123";

  const trpc = createTestTRPCClient(baseURL);

  try {
    const result = await trpc.test?.setup.mutate({
      email,
      password,
      name: options?.name,
      orgName: options?.orgName,
      workspaceName: options?.workspaceName,
    });

    if (
      !result ||
      !result.user ||
      !result.organization ||
      !result.workspace ||
      !result.dashboardUrl
    ) {
      throw new Error("Invalid response from test setup API");
    }

    return {
      email,
      password,
      user: result.user,
      organization: result.organization,
      workspace: result.workspace,
      dashboardUrl: result.dashboardUrl,
    };
  } catch (error) {
    throw new Error(
      `Failed to create test user: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Удаление тестового пользователя и всех связанных данных через TRPC
 */
export async function deleteTestUser(
  email: string,
  baseURL = "http://localhost:3000",
): Promise<void> {
  const trpc = createTestTRPCClient(baseURL);

  try {
    await trpc.test?.cleanup.mutate({ email });
  } catch (error) {
    throw new Error(
      `Failed to delete test user: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Авторизация созданного пользователя через UI
 */
export async function loginTestUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/signin");

  // Переключаемся на таб с паролем
  await page.getByRole("tab", { name: "Пароль" }).click();

  // Заполняем форму
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Пароль" }).fill(password);

  // Отправляем форму
  await page.getByRole("button", { name: "Войти" }).click();

  // Ждем редиректа на dashboard
  await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
    timeout: 15000,
  });
}

/**
 * Полная настройка теста: создание пользователя через TRPC + авторизация через UI
 * Использовать в beforeEach для быстрой подготовки тестов
 *
 * @example
 * ```typescript
 * let testUser: TestUser;
 *
 * test.beforeEach(async ({ page }) => {
 *   testUser = await setupAuthenticatedTest(page);
 * });
 *
 * test.afterEach(async () => {
 *   await deleteTestUser(testUser.email);
 * });
 * ```
 */
export async function setupAuthenticatedTest(
  page: Page,
  options?: {
    email?: string;
    password?: string;
    name?: string;
    orgName?: string;
    workspaceName?: string;
  },
): Promise<TestUser> {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";

  // Создаем пользователя через TRPC (быстро!)
  const testUser = await createTestUser(baseURL, options);

  // Авторизуемся через UI
  await loginTestUser(page, testUser.email, testUser.password);

  return testUser;
}

/**
 * Хелпер для автоматической очистки тестового пользователя
 * Регистрирует cleanup который выполнится после теста
 */
export function registerTestUserCleanup(
  testUser: TestUser,
  baseURL = "http://localhost:3000",
): void {
  // Сохраняем email для cleanup
  const email = testUser.email;

  // Регистрируем cleanup через process.on для гарантированного выполнения
  const cleanup = async () => {
    try {
      await deleteTestUser(email, baseURL);
    } catch (error) {
      // Игнорируем ошибки cleanup чтобы не ломать тесты
      console.warn(`Failed to cleanup test user ${email}:`, error);
    }
  };

  // Добавляем в очередь cleanup
  if (typeof (globalThis as any).__testCleanups === "undefined") {
    (globalThis as any).__testCleanups = [];
  }
  (globalThis as any).__testCleanups.push(cleanup);
}
