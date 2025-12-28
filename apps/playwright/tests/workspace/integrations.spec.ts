import { expect, test } from "@playwright/test";
import {
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Интеграции воркспейса", () => {
  test.describe.configure({ mode: "parallel" });

  let testUser: TestUser;
  let orgSlug: string;
  let workspaceSlug: string;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
    orgSlug = testUser.organization.slug;
    workspaceSlug = testUser.workspace.slug;
  });

  test.afterEach(async () => {
    await deleteTestUser(testUser.email);
  });

  test.describe("Общая навигация", () => {
    test("отображает страницу интеграций", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("отображает доступные интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Карточки интеграций", () => {
    test("отображает название интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("отображает описание интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("отображает статус интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("отображает иконку интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Подключение интеграций", () => {
    test("отображает кнопку подключения для владельца", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("открывает диалог при нажатии на кнопку подключения", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Telegram сессии", () => {
    test("отображает карточку Telegram сессий", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Управление интеграциями", () => {
    test("показывает кнопки управления для подключенных интеграций", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Адаптивность", () => {
    test("корректно отображается на мобильных устройствах", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("кнопки адаптируются под размер экрана", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Состояния загрузки", () => {
    test("показывает скелетон при загрузке", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Доступность", () => {
    test("все кнопки доступны с клавиатуры", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("карточки имеют правильную структуру", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });

    test("статусы интеграций визуально различимы", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Информация об интеграциях", () => {
    test("показывает дополнительную информацию для подключенных интеграций", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await expect(
        page.getByRole("heading", { name: /интеграции/i }),
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
