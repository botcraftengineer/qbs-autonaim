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

test.describe("Онбординг: создание организации и воркспейса", () => {
  const testPassword = "password123";
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `onboarding-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.goto("/auth/signup");
    await fillEmailPasswordForm(page, testEmail, testPassword);
    await submitSignUpForm(page);
    await waitForAuthSuccess(page);
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

  test("отображает страницу онбординга после регистрации", async ({ page }) => {
    await expect(page).toHaveURL("/onboarding");
    await expect(
      page.getByRole("heading", { name: "Создайте организацию" }),
    ).toBeVisible();
  });

  test("показывает индикатор прогресса", async ({ page }) => {
    const progressBars = page.locator(".h-2.w-16.rounded-full");
    await expect(progressBars).toHaveCount(2);

    await expect(progressBars.first()).toHaveClass(/bg-primary/);
    await expect(progressBars.last()).toHaveClass(/bg-muted/);
  });

  test("автоматически генерирует slug из названия организации", async ({
    page,
  }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });

    await nameInput.fill("Test Company");
    await expect(slugInput).toHaveValue("test-company");

    await nameInput.fill("Моя Компания");
    await expect(slugInput).toHaveValue("moya-kompaniya");
  });

  test("позволяет вручную изменить slug организации", async ({ page }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });

    await nameInput.fill("Test Company");
    await expect(slugInput).toHaveValue("test-company");

    await slugInput.fill("custom-slug");
    await expect(slugInput).toHaveValue("custom-slug");

    await nameInput.fill("Another Name");
    await expect(slugInput).toHaveValue("custom-slug");
  });

  test("валидирует формат slug организации", async ({ page }) => {
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });

    await expect(slugInput).toHaveAttribute("pattern", "[a-z0-9-]+");
    await expect(slugInput).toHaveAttribute(
      "title",
      "Только строчные буквы, цифры и дефис",
    );
  });

  test("отображает tooltip для slug организации", async ({ page }) => {
    const helpIcon = page.locator('label:has-text("Slug организации") + svg');
    await helpIcon.hover();

    await expect(
      page
        .getByRole("tooltip")
        .getByText(/Slug — это уникальный идентификатор для URL/),
    ).toBeVisible();
  });

  test("создает организацию с обязательными полями", async ({ page }) => {
    const orgName = `Test Org ${Date.now()}`;
    const orgSlug = `test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);

    const submitButton = page.getByRole("button", {
      name: "Создать организацию",
    });
    await submitButton.click();

    await expect(page.getByRole("button", { name: "Создание…" })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("создает организацию со всеми полями", async ({ page }) => {
    const orgName = `Full Org ${Date.now()}`;
    const orgSlug = `full-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page
      .getByRole("textbox", { name: "Описание (опционально)" })
      .fill("Test organization description");
    await page
      .getByRole("textbox", { name: "Веб-сайт (опционально)" })
      .fill("https://example.com");

    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test.skip("показывает ошибку при дублировании slug организации", async ({
    page,
  }) => {
    const orgName = `Duplicate Org ${Date.now()}`;
    const orgSlug = `duplicate-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const newEmail = `duplicate-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const newPassword = "password123";

    await page.goto("/auth/signup");
    await fillEmailPasswordForm(page, newEmail, newPassword);
    await submitSignUpForm(page);
    await page.waitForURL(/\/onboarding/, { timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill("Another Org");
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(page.getByText(/уже существует/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("переходит к созданию воркспейса после создания организации", async ({
    page,
  }) => {
    const orgName = `Workspace Test Org ${Date.now()}`;
    const orgSlug = `workspace-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const progressBars = page.locator(".h-2.w-16.rounded-full");
    await expect(progressBars.last()).toHaveClass(/bg-primary/);
  });

  test("автоматически генерирует slug из названия воркспейса", async ({
    page,
  }) => {
    const orgName = `Slug Test Org ${Date.now()}`;
    const orgSlug = `slug-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug воркспейса" });

    await nameInput.fill("Main Project");
    await expect(slugInput).toHaveValue("main-project");

    await nameInput.fill("Основной проект");
    await expect(slugInput).toHaveValue("osnovnoy-proekt");
  });

  test("позволяет вручную изменить slug воркспейса", async ({ page }) => {
    const orgName = `Manual Slug Org ${Date.now()}`;
    const orgSlug = `manual-slug-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug воркспейса" });

    await nameInput.fill("Test Workspace");
    await expect(slugInput).toHaveValue("test-workspace");

    await slugInput.fill("custom-workspace");
    await expect(slugInput).toHaveValue("custom-workspace");

    await nameInput.fill("Another Name");
    await expect(slugInput).toHaveValue("custom-workspace");
  });

  test("создает воркспейс с обязательными полями", async ({ page }) => {
    const orgName = `Workspace Org ${Date.now()}`;
    const orgSlug = `workspace-org-${Date.now()}`;
    const workspaceName = `Test Workspace ${Date.now()}`;
    const workspaceSlug = `test-workspace-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(workspaceName);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(workspaceSlug);
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    await expect(page.getByRole("button", { name: "Создание…" })).toBeVisible();

    await expect(page).toHaveURL(
      new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
      { timeout: 10000 },
    );
  });

  test("создает воркспейс со всеми полями", async ({ page }) => {
    const orgName = `Full Workspace Org ${Date.now()}`;
    const orgSlug = `full-workspace-org-${Date.now()}`;
    const workspaceName = `Full Workspace ${Date.now()}`;
    const workspaceSlug = `full-workspace-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(workspaceName);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(workspaceSlug);
    await page
      .getByRole("textbox", { name: "Описание (опционально)" })
      .fill("Test workspace description");
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
      { timeout: 10000 },
    );
  });

  test.skip("позволяет пропустить создание воркспейса", async ({ page }) => {
    const orgName = `Skip Workspace Org ${Date.now()}`;
    const orgSlug = `skip-workspace-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Пропустить" }).click();

    await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}`), {
      timeout: 10000,
    });
  });

  test("отображает URL preview для организации", async ({ page }) => {
    await expect(page.getByText(/\/orgs\//)).toBeVisible();
  });

  test("отображает URL preview для воркспейса", async ({ page }) => {
    const orgName = `URL Preview Org ${Date.now()}`;
    const orgSlug = `url-preview-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(new RegExp(`/orgs/${orgSlug}/workspaces/`)),
    ).toBeVisible();
  });

  test("кнопка создания организации disabled без обязательных полей", async ({
    page,
  }) => {
    const submitButton = page.getByRole("button", {
      name: "Создать организацию",
    });
    await expect(submitButton).toBeDisabled();

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill("Test");
    await expect(submitButton).toBeEnabled();
  });

  test("кнопка создания воркспейса disabled без обязательных полей", async ({
    page,
  }) => {
    const orgName = `Button Test Org ${Date.now()}`;
    const orgSlug = `button-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const submitButton = page.getByRole("button", {
      name: "Создать воркспейс",
    });
    await expect(submitButton).toBeDisabled();

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill("Test");
    await expect(submitButton).toBeEnabled();
  });

  test("проверка autofocus на первом поле организации", async ({ page }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    await expect(nameInput).toBeFocused();
  });

  test.skip("проверка autofocus на первом поле воркспейса", async ({
    page,
  }) => {
    const orgName = `Focus Test Org ${Date.now()}`;
    const orgSlug = `focus-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    await expect(nameInput).toBeFocused();
  });

  test("проверка maxLength для полей организации", async ({ page }) => {
    const nameInput = page.getByRole("textbox", {
      name: "Название организации",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug организации" });
    const descriptionInput = page.getByRole("textbox", {
      name: "Описание (опционально)",
    });
    const websiteInput = page.getByRole("textbox", {
      name: "Веб-сайт (опционально)",
    });

    await expect(nameInput).toHaveAttribute("maxlength", "100");
    await expect(slugInput).toHaveAttribute("maxlength", "50");
    await expect(descriptionInput).toHaveAttribute("maxlength", "500");
    await expect(websiteInput).toHaveAttribute("maxlength", "200");
  });

  test("проверка maxLength для полей воркспейса", async ({ page }) => {
    const orgName = `MaxLength Test Org ${Date.now()}`;
    const orgSlug = `maxlength-test-org-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    const nameInput = page.getByRole("textbox", {
      name: "Название воркспейса",
    });
    const slugInput = page.getByRole("textbox", { name: "Slug воркспейса" });
    const descriptionInput = page.getByRole("textbox", {
      name: "Описание (опционально)",
    });

    await expect(nameInput).toHaveAttribute("maxlength", "100");
    await expect(slugInput).toHaveAttribute("maxlength", "50");
    await expect(descriptionInput).toHaveAttribute("maxlength", "500");
  });

  test("проверка типа input для website", async ({ page }) => {
    const websiteInput = page.getByRole("textbox", {
      name: "Веб-сайт (опционально)",
    });
    await expect(websiteInput).toHaveAttribute("type", "url");
  });

  test("проверка размера кнопок на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const submitButton = page.getByRole("button", {
      name: "Создать организацию",
    });
    const box = await submitButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(36);
  });

  test("полный флоу: регистрация → организация → воркспейс → дашборд", async ({
    page,
  }) => {
    const orgName = `Full Flow Org ${Date.now()}`;
    const orgSlug = `full-flow-org-${Date.now()}`;
    const workspaceName = `Full Flow Workspace ${Date.now()}`;
    const workspaceSlug = `full-flow-workspace-${Date.now()}`;

    await page
      .getByRole("textbox", { name: "Название организации" })
      .fill(orgName);
    await page.getByRole("textbox", { name: "Slug организации" }).fill(orgSlug);
    await page.getByRole("button", { name: "Создать организацию" }).click();

    await expect(
      page.getByRole("heading", { name: "Создайте воркспейс" }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .getByRole("textbox", { name: "Название воркспейса" })
      .fill(workspaceName);
    await page
      .getByRole("textbox", { name: "Slug воркспейса" })
      .fill(workspaceSlug);
    await page.getByRole("button", { name: "Создать воркспейс" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/orgs/${orgSlug}/workspaces/${workspaceSlug}`),
      { timeout: 10000 },
    );
  });
});
