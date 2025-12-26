import { expect, test } from "@playwright/test";
import { setupAuthenticatedTest, type TestUser } from "../helpers/test-setup";

test.describe("Switcher в сайдбаре", () => {
  let testUser: TestUser;
  let orgSlug: string;
  let workspaceSlug: string;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
    orgSlug = testUser.organization.slug;
    workspaceSlug = testUser.workspace.slug;
  });



  test.describe("Отображение switcher", () => {
    test("показывает кнопку switcher с названием воркспейса", async ({
      page,
    }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await expect(switcherButton).toBeVisible();
    });

    test("открывает меню при клике на switcher", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(page.getByText("Рабочие пространства")).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /Создать рабочее пространство/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /Переключить организацию/ }),
      ).toBeVisible();
    });

    test("показывает информацию об организации", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(page.getByText(/участник/)).toBeVisible();
      await expect(page.getByText(/пространство/)).toBeVisible();
    });

    test("показывает кнопки настроек организации", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(
        page.getByRole("menuitem", { name: "Настройки" }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Потребление" }),
      ).toBeVisible();
    });
  });

  test.describe("Создание воркспейса", () => {
    test("открывает диалог создания воркспейса", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Создать рабочее пространство/ })
        .click();

      await expect(
        page.getByRole("heading", { name: "Создать воркспейс" }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Название воркспейса" }),
      ).toBeVisible();
    });

    test("создает новый воркспейс и переключается на него", async ({
      page,
    }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Создать рабочее пространство/ })
        .click();

      const newWorkspaceName = `Test Workspace ${Date.now()}`;
      const newWorkspaceSlug = `test-ws-${Date.now()}`;

      await page
        .getByRole("textbox", { name: "Название воркспейса" })
        .fill(newWorkspaceName);
      await page.getByPlaceholder("acme").fill(newWorkspaceSlug);

      await page.getByRole("button", { name: "Создать воркспейс" }).click();

      // Проверяем, что URL изменился
      await page.waitForURL(
        new RegExp(`/orgs/${orgSlug}/workspaces/${newWorkspaceSlug}`),
        { timeout: 10000 },
      );

      // Проверяем, что switcher показывает новое название
      await expect(
        page.locator("button").filter({ hasText: newWorkspaceName }).first(),
      ).toBeVisible();
    });

    test("показывает ошибку при пустом названии воркспейса", async ({
      page,
    }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Создать рабочее пространство/ })
        .click();

      await page.getByRole("button", { name: "Создать воркспейс" }).click();

      await expect(page.getByText(/обязательно/i)).toBeVisible();
    });
  });

  test.describe("Переключение между воркспейсами", () => {
    test("создает второй воркспейс и переключается между ними", async ({
      page,
    }) => {
      // Создаем второй воркспейс
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Создать рабочее пространство/ })
        .click();

      const secondWorkspaceName = `Second Workspace ${Date.now()}`;
      const secondWorkspaceSlug = `second-ws-${Date.now()}`;

      await page
        .getByRole("textbox", { name: "Название воркспейса" })
        .fill(secondWorkspaceName);
      await page.getByPlaceholder("acme").fill(secondWorkspaceSlug);

      await page.getByRole("button", { name: "Создать воркспейс" }).click();

      await page.waitForURL(
        new RegExp(`/orgs/${orgSlug}/workspaces/${secondWorkspaceSlug}`),
        { timeout: 10000 },
      );

      // Открываем switcher и проверяем, что оба воркспейса в списке
      await page
        .locator("button")
        .filter({ hasText: secondWorkspaceName })
        .first()
        .click();

      const workspaceItems = page.getByRole("menuitem").filter({
        has: page.locator("text=/⌘[12]/"),
      });

      await expect(workspaceItems).toHaveCount(2);

      // Переключаемся на первый воркспейс
      await page.getByRole("menuitem").filter({ hasText: "⌘1" }).click();

      await page.waitForURL(
        new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
        { timeout: 10000 },
      );

      expect(page.url()).toContain(workspaceSlug);
    });

    test("показывает горячие клавиши для воркспейсов", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(page.getByText("⌘1")).toBeVisible();
    });
  });

  test.describe("Переключение организаций", () => {
    test("открывает подменю переключения организаций", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Переключить организацию/ })
        .click();

      await expect(page.getByText("Организации")).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /Создать организацию/ }),
      ).toBeVisible();
    });

    test("показывает текущую организацию в списке", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Переключить организацию/ })
        .click();

      await expect(page.getByText(/пространства/)).toBeVisible();
    });

    test("открывает диалог создания организации", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await page
        .getByRole("menuitem", { name: /Переключить организацию/ })
        .click();

      await page.getByRole("menuitem", { name: /Создать организацию/ }).click();

      await expect(
        page.getByRole("heading", { name: "Создать организацию" }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Название организации" }),
      ).toBeVisible();
    });
  });

  test.describe("Кнопки действий воркспейса", () => {
    test("показывает кнопку настроек воркспейса", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      const settingsButtons = page.getByRole("menuitem", {
        name: "Настройки",
      });
      await expect(settingsButtons.first()).toBeVisible();
    });

    test("показывает кнопку приглашения в воркспейс", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(
        page.getByRole("menuitem", { name: "Пригласить" }),
      ).toBeVisible();
    });
  });

  test.describe("Закрытие switcher", () => {
    test("закрывается при клике вне меню", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(page.getByText("Рабочие пространства")).toBeVisible();

      // Кликаем вне меню
      await page.locator("main").click({ position: { x: 100, y: 100 } });

      await expect(page.getByText("Рабочие пространства")).not.toBeVisible();
    });

    test("закрывается при нажатии Escape", async ({ page }) => {
      const switcherButton = page
        .locator("button")
        .filter({ hasText: /Бесплатный/ })
        .first();
      await switcherButton.click();

      await expect(page.getByText("Рабочие пространства")).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(page.getByText("Рабочие пространства")).not.toBeVisible();
    });
  });
});
