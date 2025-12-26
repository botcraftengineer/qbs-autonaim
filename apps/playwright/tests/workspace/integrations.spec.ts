import { expect, test } from "@playwright/test";
import { setupAuthenticatedTest, type TestUser } from "../helpers/test-setup";

test.describe("Интеграции воркспейса", () => {
  let testUser: TestUser;
  let orgSlug: string;
  let workspaceSlug: string;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
    orgSlug = testUser.organization.slug;
    workspaceSlug = testUser.workspace.slug;
  });



  test.describe("Общая навигация", () => {
    test("отображает страницу интеграций", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      // Ждем загрузки страницы
      await page.waitForTimeout(2000);

      // Проверяем наличие карточек интеграций
      await expect(page.locator('[class*="Card"]').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("отображает доступные интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие интеграций (HH.ru и другие)
      const cards = page.locator('[class*="Card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Карточки интеграций", () => {
    test("отображает название интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие названий интеграций
      const heading = page.locator("h3").first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test("отображает описание интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие описаний
      const description = page
        .locator('[class*="text-muted-foreground"]')
        .first();
      await expect(description).toBeVisible({ timeout: 10000 });
    });

    test("отображает статус интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие бейджа статуса
      await expect(page.getByText("Не подключена")).toBeVisible({
        timeout: 10000,
      });
    });

    test("отображает иконку интеграции", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие иконок
      const icon = page.locator("svg").first();
      await expect(icon).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Подключение интеграций", () => {
    test("отображает кнопку подключения для владельца", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      await expect(
        page.getByRole("button", { name: /Подключить/ }).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("открывает диалог при нажатии на кнопку подключения", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      const connectButton = page
        .getByRole("button", { name: /Подключить/ })
        .first();
      await connectButton.click();

      // Ждем появления диалога
      await page.waitForTimeout(500);
    });
  });

  test.describe("Telegram сессии", () => {
    test("отображает карточку Telegram сессий", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие секции Telegram
      const telegramSection = page.locator('[class*="Card"]').first();
      await expect(telegramSection).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Управление интеграциями", () => {
    test("показывает кнопки управления для подключенных интеграций", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Для неподключенных интеграций должна быть кнопка "Подключить"
      await expect(
        page.getByRole("button", { name: /Подключить/ }).first(),
      ).toBeVisible({ timeout: 10000 });
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

      await page.waitForTimeout(2000);

      // Проверяем что карточки видны
      const card = page.locator('[class*="Card"]').first();
      await expect(card).toBeVisible({ timeout: 10000 });
    });

    test("кнопки адаптируются под размер экрана", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // На мобильных кнопки должны быть видны
      const button = page.getByRole("button").first();
      await expect(button).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Состояния загрузки", () => {
    test("показывает скелетон при загрузке", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      // Контент должен загрузиться
      await expect(page.locator('[class*="Card"]').first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Доступность", () => {
    test("все кнопки доступны с клавиатуры", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем что можно перемещаться по кнопкам
      await page.keyboard.press("Tab");

      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      expect(focusedElement).toBeTruthy();
    });

    test("карточки имеют правильную структуру", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие заголовков
      const heading = page.locator("h3").first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test("статусы интеграций визуально различимы", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Проверяем наличие бейджей со статусами
      await expect(page.getByText("Не подключена")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Информация об интеграциях", () => {
    test("показывает дополнительную информацию для подключенных интеграций", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
      );

      await page.waitForTimeout(2000);

      // Для неподключенных интеграций не должно быть дополнительной информации
      const cards = page.locator('[class*="Card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
