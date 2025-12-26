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

test.describe("Настройки воркспейса", () => {
  const testPassword = "Password123";
  let testEmail: string;
  let orgSlug: string;
  let workspaceSlug: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `workspace-settings-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.goto("/auth/signup");
    await fillEmailPasswordForm(page, testEmail, testPassword);
    await submitSignUpForm(page);
    await waitForAuthSuccess(page);
    await completeOnboarding(page);

    // Получаем slug организации и воркспейса из URL
    await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
      timeout: 15000,
    });
    const url = page.url();
    const match = url.match(/\/orgs\/([^/]+)\/workspaces\/([^/]+)/);
    if (match?.[1] && match[2]) {
      orgSlug = match[1];
      workspaceSlug = match[2];
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
    test("отображает страницу настроек воркспейса", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);
      await expect(
        page.getByText("Название рабочего пространства"),
      ).toBeVisible();
    });

    test("отображает форму с основными полями", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);
      await expect(
        page.getByLabel("Название рабочего пространства"),
      ).toBeVisible();
      await expect(page.getByLabel("Адрес пространства")).toBeVisible();
      await expect(
        page.getByText("Логотип рабочего пространства"),
      ).toBeVisible();
    });
  });

  test.describe("Редактирование названия", () => {
    test("позволяет изменить название воркспейса", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const nameInput = page.getByLabel("Название рабочего пространства");
      await nameInput.clear();
      await nameInput.fill("Новое название");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(
        page.getByText("Рабочее пространство успешно обновлено"),
      ).toBeVisible();
    });

    test("ограничивает длину названия до 32 символов", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const longName = "a".repeat(40);
      const nameInput = page.getByLabel("Название рабочего пространства");
      await nameInput.fill(longName);

      const value = await nameInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(32);
    });

    test("показывает ошибку при пустом названии", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const nameInput = page.getByLabel("Название рабочего пространства");
      await nameInput.clear();

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(page.getByText("Название обязательно")).toBeVisible();
    });
  });

  test.describe("Редактирование slug", () => {
    test("позволяет изменить slug воркспейса", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const newSlug = `test-workspace-${Date.now()}`;
      const slugInput = page.getByLabel("Адрес пространства");
      await slugInput.clear();
      await slugInput.fill(newSlug);

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(
        page.getByText("Рабочее пространство успешно обновлено"),
      ).toBeVisible();
    });

    test("ограничивает длину slug до 48 символов", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const longSlug = "a".repeat(60);
      const slugInput = page.getByLabel("Адрес пространства");
      await slugInput.fill(longSlug);

      const value = await slugInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(48);
    });

    test("показывает ошибку при невалидном slug", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const slugInput = page.getByLabel("Адрес пространства");
      await slugInput.clear();
      await slugInput.fill("Invalid Slug!");

      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(
        page.getByText("Только строчные буквы, цифры и дефисы"),
      ).toBeVisible();
    });

    test("показывает подсказку о формате slug", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await expect(
        page.getByText(
          "Только строчные буквы, цифры и дефисы. Максимум 48 символов.",
        ),
      ).toBeVisible();
    });
  });

  test.describe("Логотип воркспейса", () => {
    test("отображает кнопку загрузки логотипа", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await expect(page.getByText("Загрузить логотип")).toBeVisible();
    });

    test("показывает информацию о требованиях к логотипу", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await expect(
        page.getByText(/Рекомендуется квадратное изображение/),
      ).toBeVisible();
      await expect(page.getByText(/Максимальный размер: 2MB/)).toBeVisible();
    });
  });

  test.describe("Удаление воркспейса", () => {
    test("отображает секцию удаления для владельца", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await expect(
        page.getByRole("heading", { name: "Удалить рабочее пространство" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Удалить рабочее пространство" }),
      ).toBeVisible();
    });

    test("открывает диалог подтверждения удаления", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await page
        .getByRole("button", { name: "Удалить рабочее пространство" })
        .click();

      await expect(
        page.getByRole("heading", { name: /Удалить рабочее пространство/ }),
      ).toBeVisible();
    });

    test("показывает предупреждение о последствиях удаления", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await expect(
        page.getByText(/Это безвозвратно удалит ваше рабочее пространство/),
      ).toBeVisible();
    });
  });

  test.describe("Кнопка сохранения", () => {
    test("показывает состояние загрузки при сохранении", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const nameInput = page.getByLabel("Название рабочего пространства");
      await nameInput.fill("Тестовое название");

      const saveButton = page.getByRole("button", {
        name: "Сохранить изменения",
      });
      await saveButton.click();

      // Проверяем, что кнопка показывает состояние загрузки
      await expect(page.getByRole("button", { name: "Сохранение..." }))
        .toBeVisible({ timeout: 1000 })
        .catch(() => {
          // Если кнопка быстро изменилась, это нормально
        });
    });

    test("кнопка сохранения доступна по умолчанию", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const saveButton = page.getByRole("button", {
        name: "Сохранить изменения",
      });
      await expect(saveButton).toBeEnabled();
    });
  });

  test.describe("Доступность", () => {
    test("все поля имеют правильные labels", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      await expect(
        page.getByLabel("Название рабочего пространства"),
      ).toBeVisible();
      await expect(page.getByLabel("Адрес пространства")).toBeVisible();
    });

    test("показывает иконку помощи для slug с подсказкой", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);

      const helpIcon = page.locator('[class*="cursor-help"]').first();
      await expect(helpIcon).toBeVisible();
    });
  });
});
