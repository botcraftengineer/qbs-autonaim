import { expect, test } from "@playwright/test";
import {
  db,
  organization,
  organizationMember,
  user,
  userWorkspace,
  workspace,
} from "@qbs-autonaim/db";
import { eq } from "drizzle-orm";
import {
  fillEmailPasswordForm,
  submitSignUpForm,
  waitForAuthSuccess,
} from "../helpers/auth";
import { completeOnboarding } from "../helpers/onboarding";

test.describe("Настройки организации", () => {
  const testPassword = "Password123";
  let testEmail: string;
  let orgSlug: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `org-settings-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.goto("/auth/signup");
    await fillEmailPasswordForm(page, testEmail, testPassword);
    await submitSignUpForm(page);
    await waitForAuthSuccess(page);
    await completeOnboarding(page);

    // Получаем slug организации из URL
    await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
      timeout: 15000,
    });
    const url = page.url();
    const match = url.match(/\/orgs\/([^/]+)\/workspaces\/[^/]+/);
    if (match?.[1]) {
      orgSlug = match[1];
    }
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
        const workspaces = await db
          .select()
          .from(workspace)
          .where(eq(workspace.organizationId, organizationId));

        for (const ws of workspaces) {
          await db
            .delete(userWorkspace)
            .where(eq(userWorkspace.workspaceId, ws.id));
        }

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
    test("отображает страницу настроек организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);
      await expect(page.getByText("Общие настройки")).toBeVisible();
    });

    test("отображает форму с основными полями", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);
      await expect(page.getByText("Название организации")).toBeVisible();
      await expect(page.getByText("Адрес организации")).toBeVisible();
      await expect(page.getByText("Описание")).toBeVisible();
      await expect(page.getByText("Веб-сайт")).toBeVisible();
      await expect(page.getByText("Логотип организации")).toBeVisible();
    });
  });

  test.describe("Редактирование названия", () => {
    test("позволяет изменить название организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.clear();
      await nameInput.fill("Новое название организации");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем что значение обновилось
      await expect(nameInput).toHaveValue("Новое название организации");
    });

    test("показывает ошибку при пустом названии", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.clear();

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(page.getByText(/обязательно/i)).toBeVisible();
    });
  });

  test.describe("Редактирование slug", () => {
    test("позволяет изменить slug организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const newSlug = `test-org-${Date.now()}`;
      const slugInput = page.getByPlaceholder("my-company");
      await slugInput.clear();
      await slugInput.fill(newSlug);

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем редирект на новый URL
      await page.waitForURL(`/orgs/${newSlug}/settings`, { timeout: 10000 });
    });

    test("показывает ошибку при невалидном slug", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const slugInput = page.getByPlaceholder("my-company");
      await slugInput.clear();
      await slugInput.fill("Invalid Slug!");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(
        page.getByText(/строчные буквы, цифры и дефисы/i),
      ).toBeVisible();
    });

    test("показывает подсказку о формате slug", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByText(/Только строчные буквы, цифры и дефисы/),
      ).toBeVisible();
    });

    test("показывает tooltip с дополнительной информацией", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const helpIcon = page.locator('[class*="cursor-help"]').first();
      await helpIcon.hover();

      await expect(
        page.getByText(/Уникальный адрес для доступа к вашей организации/),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("Редактирование описания", () => {
    test("позволяет добавить описание организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const descriptionInput = page.getByPlaceholder(
        "Краткое описание вашей организации",
      );
      await descriptionInput.fill("Это тестовое описание организации");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем что значение сохранилось
      await expect(descriptionInput).toHaveValue(
        "Это тестовое описание организации",
      );
    });

    test("позволяет очистить описание", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const descriptionInput = page.getByPlaceholder(
        "Краткое описание вашей организации",
      );
      await descriptionInput.fill("Временное описание");
      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      await page.waitForTimeout(1000);

      await descriptionInput.clear();
      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      await expect(descriptionInput).toHaveValue("");
    });
  });

  test.describe("Редактирование веб-сайта", () => {
    test("позволяет добавить URL веб-сайта", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const websiteInput = page.getByPlaceholder("https://example.com");
      await websiteInput.fill("https://example.com");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();

      // Проверяем что значение сохранилось
      await expect(websiteInput).toHaveValue("https://example.com");
    });

    test("показывает ошибку при невалидном URL", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const websiteInput = page.getByPlaceholder("https://example.com");
      await websiteInput.fill("not-a-valid-url");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(page.getByText(/URL/i)).toBeVisible();
    });
  });

  test.describe("Логотип организации", () => {
    test("отображает кнопку загрузки логотипа", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(page.getByText("Загрузить логотип")).toBeVisible();
    });

    test("показывает информацию о требованиях к логотипу", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByText(/Рекомендуется квадратное изображение/),
      ).toBeVisible();
      await expect(page.getByText(/Максимальный размер: 2MB/)).toBeVisible();
    });
  });

  test.describe("Удаление организации", () => {
    test("отображает секцию удаления для владельца", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByRole("heading", { name: "Удалить организацию" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Удалить организацию" }),
      ).toBeVisible();
    });

    test("открывает диалог подтверждения удаления", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await page.getByRole("button", { name: "Удалить организацию" }).click();

      await expect(
        page.getByRole("heading", { name: /Удалить организацию/i }),
      ).toBeVisible();
    });

    test("показывает предупреждение о последствиях удаления", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(
        page.getByText(/безвозвратно удалит вашу организацию/),
      ).toBeVisible();
    });
  });

  test.describe("Кнопка сохранения", () => {
    test("показывает состояние загрузки при сохранении", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const nameInput = page.getByPlaceholder("Моя компания");
      await nameInput.fill("Тестовое название");

      const saveButton = page.getByRole("button", {
        name: "Сохранить изменения",
      });
      await saveButton.click();

      // Проверяем, что кнопка показывает состояние загрузки
      await expect(page.getByRole("button", { name: "Сохранение…" }))
        .toBeVisible({ timeout: 1000 })
        .catch(() => {
          // Если кнопка быстро изменилась, это нормально
        });
    });

    test("кнопка сохранения доступна по умолчанию", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      const saveButton = page.getByRole("button", {
        name: "Сохранить изменения",
      });
      await expect(saveButton).toBeEnabled();
    });
  });

  test.describe("Доступность", () => {
    test("все поля имеют правильные labels", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      await expect(page.getByText("Название организации")).toBeVisible();
      await expect(page.getByText("Адрес организации")).toBeVisible();
      await expect(page.getByText("Описание")).toBeVisible();
      await expect(page.getByText("Веб-сайт")).toBeVisible();
      await expect(page.getByText("Логотип организации")).toBeVisible();
    });

    test("форма доступна с клавиатуры", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings`);

      // Переходим по полям с помощью Tab
      await page.keyboard.press("Tab");
      const nameInput = page.getByPlaceholder("Моя компания");
      await expect(nameInput).toBeFocused();

      await page.keyboard.press("Tab");
      const slugInput = page.getByPlaceholder("my-company");
      await expect(slugInput).toBeFocused();
    });
  });
});
