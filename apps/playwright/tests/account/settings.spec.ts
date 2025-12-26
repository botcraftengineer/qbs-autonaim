import { expect, test } from "@playwright/test";
import {
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Настройки аккаунта", () => {
  let testUser: TestUser;

  test.beforeEach(async ({ page }) => {
    // Быстрое создание пользователя через API + авторизация
    testUser = await setupAuthenticatedTest(page);
  });

  test.afterEach(async () => {
    if (testUser?.email) {
      await deleteTestUser(testUser.email);
    }
  });

  test.describe("Общая навигация", () => {
    test("отображает страницу настроек аккаунта", async ({ page }) => {
      await page.goto("/account/settings");
      await expect(
        page.getByRole("heading", { name: "Настройки аккаунта" }),
      ).toBeVisible();
    });

    test("отображает вкладки Основное и Безопасность", async ({ page }) => {
      await page.goto("/account/settings");
      await expect(page.getByRole("tab", { name: "Основное" })).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Безопасность" }),
      ).toBeVisible();
    });

    test("переключается между вкладками", async ({ page }) => {
      await page.goto("/account/settings");
      await page.getByRole("tab", { name: "Безопасность" }).click();
      await expect(page).toHaveURL("/account/settings/security");

      await page.getByRole("tab", { name: "Основное" }).click();
      await expect(page).toHaveURL("/account/settings");
    });
  });

  test.describe("Вкладка Основное", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/account/settings");
      // Ждем загрузки основных элементов
      await page.waitForSelector("text=Ваше имя", { timeout: 10000 });
    });

    test("отображает все секции настроек", async ({ page }) => {
      await expect(page.getByText("Ваше имя")).toBeVisible();
      await expect(page.getByText("Ваш Email")).toBeVisible();
      await expect(page.getByText("Ваш аватар")).toBeVisible();
    });

    test("ограничивает длину имени до 32 символов", async ({ page }) => {
      const longName = "a".repeat(40);
      const nameInput = page.getByPlaceholder("Введите ваше имя");
      await nameInput.fill(longName);
      const value = await nameInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(32);
    });

    test("отображает email пользователя как disabled", async ({ page }) => {
      const emailInput = page.getByPlaceholder("your@email.com");
      await expect(emailInput).toBeDisabled();
      await expect(emailInput).toHaveValue(testUser.email);
    });
  });

  test.describe("Вкладка Безопасность", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/account/settings/security");
    });

    test("показывает требования к паролю при вводе", async ({ page }) => {
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");
      await newPasswordInput.fill("test");

      await expect(page.getByText("Цифра")).toBeVisible();
      await expect(page.getByText("Заглавная буква")).toBeVisible();
      await expect(page.getByText("Строчная буква")).toBeVisible();
      await expect(page.getByText("8 символов")).toBeVisible();
    });

    test("не позволяет изменить пароль с невалидным новым паролем", async ({
      page,
    }) => {
      const currentPasswordInput = page.getByPlaceholder(
        "Введите текущий пароль",
      );
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");

      await currentPasswordInput.fill(testUser.password);
      await newPasswordInput.fill("weak");

      const updateButton = page.getByRole("button", {
        name: "Обновить пароль",
      });
      await expect(updateButton).toBeDisabled();
    });

    test("открывает диалог подтверждения удаления аккаунта", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Удалить аккаунт" })
        .last()
        .click();

      await expect(
        page.getByRole("heading", { name: "Удалить аккаунт" }),
      ).toBeVisible();
    });

    test("требует подтверждающую фразу для удаления аккаунта", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Удалить аккаунт" })
        .last()
        .click();

      const confirmButton = page.getByRole("button", {
        name: "Подтвердить удаление аккаунта",
      });
      await expect(confirmButton).toBeDisabled();

      const confirmInput = page.getByPlaceholder("удалить мой аккаунт");
      await confirmInput.fill("удалить мой аккаунт");
      await expect(confirmButton).toBeEnabled();
    });

    test("закрывает диалог удаления при нажатии Отмена", async ({ page }) => {
      await page
        .getByRole("button", { name: "Удалить аккаунт" })
        .last()
        .click();

      const dialog = page.getByRole("heading", { name: "Удалить аккаунт" });
      await expect(dialog).toBeVisible();

      await page.getByRole("button", { name: "Отмена" }).click();
      await expect(dialog).not.toBeVisible();
    });
  });
});
