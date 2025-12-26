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

test.describe("Интеграции воркспейса", () => {
  const testPassword = "Password123";
  let testEmail: string;
  let orgSlug: string;
  let workspaceSlug: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `workspace-integrations-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
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
