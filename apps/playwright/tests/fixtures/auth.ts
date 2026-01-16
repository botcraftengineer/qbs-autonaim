import { test as base, type Page } from "@playwright/test";
import {
  acquireUser,
  cleanupUserData,
  loginWithPoolUser,
} from "../helpers/user-pool";

type TestUser = {
  email: string;
  password: string;
  name: string;
  id?: string;
  inUse: boolean;
};

type AuthFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
};

export const test = base.extend<AuthFixtures>({
  testUser: async ({ page }, use) => {
    const user = acquireUser();
    await use(user);
    // Пользователь будет освобожден в cleanupUserData
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Авторизуемся с пользователем из пула
    await loginWithPoolUser(page);
    await use(page);
    // Очищаем данные после теста
    await cleanupUserData(page, testUser);
  },
});

export { expect } from "@playwright/test";
