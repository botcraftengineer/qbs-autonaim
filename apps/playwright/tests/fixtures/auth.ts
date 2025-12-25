import { test as base, type Page } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Здесь можно добавить логику для автоматической авторизации
    // Например, установка cookies или localStorage
    await use(page);
  },
});

export { expect } from "@playwright/test";
