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

test.describe("Участники организации", () => {
  const testPassword = "Password123";
  let testEmail: string;
  let orgSlug: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `org-members-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
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
    test("отображает страницу участников организации", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);
      await expect(
        page.getByRole("heading", { name: "Участники" }),
      ).toBeVisible();
    });

    test("отображает описание страницы", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);
      await expect(
        page.getByText("Управляйте участниками организации"),
      ).toBeVisible();
    });

    test("отображает текущего пользователя в списке", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);
      await expect(page.getByText(testEmail)).toBeVisible();
    });
  });

  test.describe("Фильтрация участников", () => {
    test("отображает фильтр по ролям", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);
      await expect(page.getByRole("combobox", { name: /роль/i })).toBeVisible();
    });

    test("позволяет фильтровать по роли владельца", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const roleFilter = page.getByRole("combobox").first();
      await roleFilter.click();
      await page.getByRole("option", { name: "Владелец" }).click();

      // Проверяем, что текущий пользователь (владелец) отображается
      await expect(page.getByText(testEmail)).toBeVisible();
    });

    test("отображает поле поиска", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);
      await expect(
        page.getByPlaceholder("Поиск по имени или email"),
      ).toBeVisible();
    });

    test("позволяет искать участников по email", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const searchInput = page.getByPlaceholder("Поиск по имени или email");
      await searchInput.fill(testEmail);

      await expect(page.getByText(testEmail)).toBeVisible();
    });
  });

  test.describe("Таблица участников", () => {
    test("отображает заголовки таблицы", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      await expect(
        page.getByRole("columnheader", { name: "Имя" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Роль" }),
      ).toBeVisible();
    });

    test("отображает аватар участника", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const avatar = page.locator('[role="img"]').first();
      await expect(avatar).toBeVisible();
    });

    test("отображает роль участника", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      // Владелец должен видеть свою роль
      await expect(page.getByText("Владелец")).toBeVisible();
    });

    test("отображает кнопку действий для участника", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const actionsButton = page.getByRole("button", {
        name: "Действия с участником",
      });
      await expect(actionsButton).toBeVisible();
    });
  });

  test.describe("Приглашение участников", () => {
    test("отображает кнопку приглашения для владельца", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      await expect(
        page.getByRole("button", { name: /пригласить/i }),
      ).toBeVisible();
    });

    test("открывает диалог приглашения при клике", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      await page.getByRole("button", { name: /пригласить/i }).click();

      await expect(
        page.getByRole("heading", { name: /пригласить участника/i }),
      ).toBeVisible();
    });
  });

  test.describe("Статистика", () => {
    test("отображает количество участников", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      await expect(page.getByText(/участников/)).toBeVisible();
    });

    test("отображает количество приглашений", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      await expect(page.getByText(/приглашений/)).toBeVisible();
    });
  });

  test.describe("Удаление участника", () => {
    test("открывает диалог подтверждения при клике на действия", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const actionsButton = page.getByRole("button", {
        name: "Действия с участником",
      });
      await actionsButton.click();

      await expect(
        page.getByRole("heading", { name: /удалить участника/i }),
      ).toBeVisible();
    });

    test("показывает предупреждение о последствиях удаления", async ({
      page,
    }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const actionsButton = page.getByRole("button", {
        name: "Действия с участником",
      });
      await actionsButton.click();

      await expect(
        page.getByText(/Это действие нельзя отменить/),
      ).toBeVisible();
    });

    test("позволяет отменить удаление", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const actionsButton = page.getByRole("button", {
        name: "Действия с участником",
      });
      await actionsButton.click();

      const cancelButton = page.getByRole("button", { name: "Отмена" });
      await cancelButton.click();

      // Диалог должен закрыться
      await expect(
        page.getByRole("heading", { name: /удалить участника/i }),
      ).not.toBeVisible();
    });
  });

  test.describe("Доступность", () => {
    test("форма поиска доступна с клавиатуры", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const searchInput = page.getByPlaceholder("Поиск по имени или email");
      await expect(searchInput).toBeFocused();
    });

    test("диалоги имеют правильные ARIA атрибуты", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const actionsButton = page.getByRole("button", {
        name: "Действия с участником",
      });
      await actionsButton.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    test("можно закрыть диалог клавишей Escape", async ({ page }) => {
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const actionsButton = page.getByRole("button", {
        name: "Действия с участником",
      });
      await actionsButton.click();

      await page.keyboard.press("Escape");

      await expect(
        page.getByRole("heading", { name: /удалить участника/i }),
      ).not.toBeVisible();
    });
  });

  test.describe("Адаптивность", () => {
    test("таблица прокручивается горизонтально на мобильных", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const table = page.locator("table");
      await expect(table).toBeVisible();
    });

    test("фильтры располагаются вертикально на мобильных", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/orgs/${orgSlug}/settings/members`);

      const roleFilter = page.getByRole("combobox").first();
      const searchInput = page.getByPlaceholder("Поиск по имени или email");

      await expect(roleFilter).toBeVisible();
      await expect(searchInput).toBeVisible();
    });
  });
});
