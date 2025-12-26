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
      await page.waitForLoadState("networkidle");
      await expect(
        page.getByRole("heading", { name: "Настройки аккаунта" }),
      ).toBeVisible();
      await expect(
        page.getByText("Управляйте настройками вашего аккаунта"),
      ).toBeVisible();
    });

    test("отображает вкладки Основное и Безопасность", async ({ page }) => {
      await page.goto("/account/settings");
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("tab", { name: "Основное" })).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Безопасность" }),
      ).toBeVisible();
    });

    test("переключается между вкладками", async ({ page }) => {
      await page.goto("/account/settings");
      await page.waitForLoadState("networkidle");

      await page.getByRole("tab", { name: "Безопасность" }).click();
      await expect(page).toHaveURL("/account/settings/security");
      await expect(page.getByText("Пароль")).toBeVisible();

      await page.getByRole("tab", { name: "Основное" }).click();
      await expect(page).toHaveURL("/account/settings");
      await expect(page.getByText("Ваше имя")).toBeVisible();
    });
  });

  test.describe("Вкладка Основное", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/account/settings");
      await page.waitForLoadState("networkidle");
    });

    test("отображает все секции настроек", async ({ page }) => {
      await expect(page.getByText("Ваше имя")).toBeVisible();
      await expect(page.getByText("Ваш Email")).toBeVisible();
      await expect(page.getByText("Ваш аватар")).toBeVisible();
    });

    test("изменяет имя пользователя", async ({ page }) => {
      const newName = `Test User ${Date.now()}`;

      const nameInput = page.getByPlaceholder("Введите ваше имя");
      await nameInput.fill(newName);

      const saveButton = page
        .locator("text=Ваше имя")
        .locator("..")
        .locator("..")
        .getByRole("button", { name: "Сохранить изменения" })
        .first();

      await saveButton.click();
      await expect(page.getByText("Изменения сохранены")).toBeVisible();

      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(nameInput).toHaveValue(newName);
    });

    test("не позволяет сохранить пустое имя", async ({ page }) => {
      const nameInput = page.getByPlaceholder("Введите ваше имя");
      await nameInput.clear();

      const saveButton = page
        .locator("text=Ваше имя")
        .locator("..")
        .locator("..")
        .getByRole("button", { name: "Сохранить изменения" })
        .first();

      await expect(saveButton).toBeDisabled();
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

    test("кнопка сохранения email disabled", async ({ page }) => {
      const saveButton = page
        .locator("text=Ваш Email")
        .locator("..")
        .locator("..")
        .getByRole("button", { name: "Сохранить изменения" });

      await expect(saveButton).toBeDisabled();
    });

    test("отображает аватар пользователя", async ({ page }) => {
      const avatarSection = page.locator("text=Ваш аватар").locator("..");
      await expect(avatarSection).toBeVisible();
    });

    test("показывает кнопки управления аватаром", async ({ page }) => {
      await expect(page.getByText("Загрузить аватар")).toBeVisible();
      const deleteButton = page
        .getByRole("button", { name: "Удалить" })
        .first();
      await expect(deleteButton).toBeVisible();
    });
  });

  test.describe("Вкладка Безопасность", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/account/settings/security");
      await page.waitForLoadState("networkidle");
    });

    test("отображает секцию пароля", async ({ page }) => {
      await expect(page.getByText("Пароль").first()).toBeVisible();
      await expect(
        page.getByText("Управляйте паролем вашего аккаунта"),
      ).toBeVisible();
    });

    test("отображает поля для смены пароля", async ({ page }) => {
      await expect(
        page.getByPlaceholder("Введите текущий пароль"),
      ).toBeVisible();
      await expect(page.getByPlaceholder("Введите новый пароль")).toBeVisible();
    });

    test("показывает требования к паролю при вводе", async ({ page }) => {
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");
      await newPasswordInput.fill("test");

      await expect(page.getByText("Цифра")).toBeVisible();
      await expect(page.getByText("Заглавная буква")).toBeVisible();
      await expect(page.getByText("Строчная буква")).toBeVisible();
      await expect(page.getByText("8 символов")).toBeVisible();
    });

    test("валидирует требования к паролю", async ({ page }) => {
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");

      await newPasswordInput.fill("test");
      const digitIndicator = page.locator("text=Цифра").locator("..");
      await expect(digitIndicator).not.toHaveClass(/text-green-600/);

      await newPasswordInput.fill("Test1234");
      await expect(digitIndicator).toHaveClass(/text-green-600/);
    });

    test("изменяет пароль с валидными данными", async ({ page }) => {
      const currentPasswordInput = page.getByPlaceholder(
        "Введите текущий пароль",
      );
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");

      await currentPasswordInput.fill(testPassword);
      await newPasswordInput.fill("NewPassword123");

      const updateButton = page.getByRole("button", {
        name: "Обновить пароль",
      });
      await updateButton.click();

      await expect(page.getByText("Пароль успешно изменен")).toBeVisible();
    });

    test("не позволяет изменить пароль без текущего пароля", async ({
      page,
    }) => {
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");
      await newPasswordInput.fill("NewPassword123");

      const updateButton = page.getByRole("button", {
        name: "Обновить пароль",
      });
      await expect(updateButton).toBeDisabled();
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

    test("показывает ошибку при неверном текущем пароле", async ({ page }) => {
      const currentPasswordInput = page.getByPlaceholder(
        "Введите текущий пароль",
      );
      const newPasswordInput = page.getByPlaceholder("Введите новый пароль");

      await currentPasswordInput.fill("WrongPassword123");
      await newPasswordInput.fill("NewPassword123");

      const updateButton = page.getByRole("button", {
        name: "Обновить пароль",
      });
      await updateButton.click();

      await expect(page.getByText(/Не удалось изменить пароль/i)).toBeVisible();
    });

    test("отображает секцию удаления аккаунта", async ({ page }) => {
      await expect(page.getByText("Удалить аккаунт").first()).toBeVisible();
      await expect(
        page.getByText(
          /Безвозвратно удалит ваш аккаунт со всеми workspace, вакансиями и откликами/i,
        ),
      ).toBeVisible();
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
      await expect(
        page.getByText(/Внимание: Это безвозвратно удалит ваш аккаунт/i),
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
      await confirmInput.fill("неправильная фраза");
      await expect(confirmButton).toBeDisabled();

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
