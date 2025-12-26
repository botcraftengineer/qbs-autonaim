import { expect, test } from "@playwright/test";
import {
  db,
  organization,
  organizationMember,
  user,
  workspace,
} from "@qbs-autonaim/db";
import { eq } from "drizzle-orm";
import {
  fillEmailPasswordForm,
  submitSignUpForm,
  waitForAuthSuccess,
} from "../helpers/auth";
import { completeOnboarding } from "../helpers/onboarding";

test.describe("Настройки аккаунта", () => {
  const testPassword = "Password123";
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `settings-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.goto("/auth/signup");
    await fillEmailPasswordForm(page, testEmail, testPassword);
    await submitSignUpForm(page);
    await waitForAuthSuccess(page);
    await completeOnboarding(page);
  });

  test.afterEach(async () => {
    if (!testEmail) return;

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, testEmail))
      .limit(1);

    if (userRecord[0]) {
      const userOrgs = await db
        .select({ organizationId: organizationMember.organizationId })
        .from(organizationMember)
        .where(eq(organizationMember.userId, userRecord[0].id));

      for (const { organizationId } of userOrgs) {
        await db
          .delete(workspace)
          .where(eq(workspace.organizationId, organizationId));
        await db
          .delete(organizationMember)
          .where(eq(organizationMember.organizationId, organizationId));
        await db
          .delete(organization)
          .where(eq(organization.id, organizationId));
      }

      await db.delete(user).where(eq(user.id, userRecord[0].id));
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
      await expect(emailInput).toHaveValue(testEmail);
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

      await currentPasswordInput.fill(testPassword);
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
