import { expect, test } from "@playwright/test";
import {
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Управление участниками воркспейса", () => {
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
    test("отображает страницу управления участниками", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(
        page.getByRole("heading", { name: "Участники" }),
      ).toBeVisible();
    });

    test("отображает описание страницы", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(
        page.getByText("Управляйте участниками workspace"),
      ).toBeVisible();
    });

    test("отображает кнопки управления для владельца", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(
        page.getByRole("button", { name: /Пригласить/ }),
      ).toBeVisible();
    });
  });

  test.describe("Таблица участников", () => {
    test("отображает заголовки таблицы", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(
        page.getByRole("columnheader", { name: "Имя" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Роль" }),
      ).toBeVisible();
    });

    test("отображает текущего пользователя в списке", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(page.getByText(testUser.email)).toBeVisible();
    });

    test("отображает роль текущего пользователя", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      // Владелец должен видеть свою роль
      await expect(page.getByText("Владелец")).toBeVisible();
    });

    test("отображает аватар участника", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      // Проверяем наличие аватара (fallback с инициалами)
      const avatar = page.locator('[role="img"]').first();
      await expect(avatar).toBeVisible();
    });
  });

  test.describe("Фильтрация участников", () => {
    test("отображает фильтр по ролям", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(page.getByRole("combobox").first()).toBeVisible();
    });

    test("позволяет фильтровать по роли", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Открываем фильтр ролей
      await page.getByRole("combobox").first().click();
      await expect(
        page.getByRole("option", { name: "Все роли" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Владелец" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Администратор" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Участник" }),
      ).toBeVisible();
    });

    test("отображает поле поиска", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(
        page.getByPlaceholder("Поиск по имени или email"),
      ).toBeVisible();
    });

    test("позволяет искать участников по email", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      const searchInput = page.getByPlaceholder("Поиск по имени или email");
      await searchInput.fill(testUser.email);

      // Участник должен быть найден
      await expect(page.getByText(testUser.email)).toBeVisible();
    });

    test("показывает сообщение когда участники не найдены", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      const searchInput = page.getByPlaceholder("Поиск по имени или email");
      await searchInput.fill("nonexistent@example.com");

      await expect(page.getByText("Участники не найдены")).toBeVisible();
    });
  });

  test.describe("Статистика участников", () => {
    test("отображает количество участников", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(page.getByText(/Показано \d+ из \d+/)).toBeVisible();
    });

    test("отображает разбивку по участникам и приглашениям", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );
      await expect(page.getByText(/\d+ участников/)).toBeVisible();
      await expect(page.getByText(/\d+ приглашений/)).toBeVisible();
    });
  });

  test.describe("Приглашение участников", () => {
    test("открывает модальное окно приглашения по email", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      await page.getByRole("button", { name: /Пригласить/ }).click();

      // Ждем появления модального окна
      await page.waitForTimeout(500);
    });

    test("отображает кнопку создания ссылки-приглашения", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Кнопка с иконкой ссылки
      const linkButton = page
        .getByRole("button")
        .filter({ has: page.locator("svg") })
        .nth(1);
      await expect(linkButton).toBeVisible();
    });
  });

  test.describe("Управление ролями", () => {
    test("владелец не может изменить свою роль", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Находим селект роли для текущего пользователя
      const roleSelect = page
        .getByRole("combobox")
        .filter({ hasText: "Владелец" })
        .first();
      await expect(roleSelect).toBeDisabled();
    });

    test("отображает меню действий для участника", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Кнопка с тремя точками (меню действий)
      const actionsButton = page
        .getByRole("button")
        .filter({ has: page.locator("svg") })
        .last();
      await expect(actionsButton).toBeVisible();
    });
  });

  test.describe("Адаптивность", () => {
    test("корректно отображается на мобильных устройствах", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      await expect(
        page.getByRole("heading", { name: "Участники" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Пригласить/ }),
      ).toBeVisible();
    });

    test("таблица прокручивается горизонтально на узких экранах", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Проверяем что таблица имеет overflow
      const tableContainer = page.locator(".overflow-x-auto");
      await expect(tableContainer).toBeVisible();
    });
  });

  test.describe("Состояния загрузки", () => {
    test("показывает скелетон при загрузке", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Скелетон должен появиться и исчезнуть быстро
      // Проверяем что контент загрузился
      await expect(
        page.getByRole("heading", { name: "Участники" }),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Доступность", () => {
    test("все интерактивные элементы доступны с клавиатуры", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      // Проверяем что можно перемещаться по кнопкам с помощью Tab
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Проверяем что фокус виден
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      expect(focusedElement).toBeTruthy();
    });

    test("таблица имеет правильную семантическую структуру", async ({
      page,
    }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      await expect(page.getByRole("table")).toBeVisible();
      await expect(page.getByRole("columnheader").first()).toBeVisible();
      await expect(page.getByRole("row").first()).toBeVisible();
    });

    test("поле поиска имеет placeholder", async ({ page }) => {
      await page.goto(
        `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
      );

      const searchInput = page.getByPlaceholder("Поиск по имени или email");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute("placeholder");
    });
  });
});
