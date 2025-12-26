import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function completeOnboarding(
  page: Page,
  orgName = "Test Org",
  workspaceName = "Test Workspace",
) {
  // Ждем либо страницу онбординга, либо редирект на dashboard
  try {
    await page.waitForURL(/\/(onboarding|orgs)/, { timeout: 10000 });
  } catch {
    // Если не дождались, проверяем текущий URL
    const currentUrl = page.url();
    if (!currentUrl.includes("/onboarding") && !currentUrl.includes("/orgs")) {
      throw new Error(`Unexpected URL after auth: ${currentUrl}`);
    }
  }

  const currentUrl = page.url();

  // Если уже на dashboard, онбординг пройден
  if (currentUrl.includes("/orgs/") && currentUrl.includes("/workspaces/")) {
    return;
  }

  // Если не на странице онбординга, значит что-то пошло не так
  if (!currentUrl.includes("/onboarding")) {
    return;
  }

  // Создаем организацию
  const orgNameInput = page.getByRole("textbox", {
    name: "Название организации",
  });

  // Ждем появления формы создания организации
  await expect(orgNameInput).toBeVisible({ timeout: 10000 });
  await orgNameInput.fill(orgName);

  // Генерируем уникальный slug
  const timestamp = Date.now();
  const orgSlugInput = page.getByRole("textbox", {
    name: "Slug организации",
  });
  await orgSlugInput.fill(`test-org-${timestamp}`);

  // Кликаем на кнопку создания
  const createOrgButton = page.getByRole("button", {
    name: "Создать организацию",
  });
  await expect(createOrgButton).toBeEnabled({ timeout: 5000 });
  await createOrgButton.click();

  // Ждем перехода на следующий шаг (создание workspace)
  await page.waitForURL(/\/onboarding/, { timeout: 10000 });

  // Создаем workspace
  const workspaceNameInput = page.getByRole("textbox", {
    name: "Название воркспейса",
  });

  await expect(workspaceNameInput).toBeVisible({ timeout: 10000 });
  await workspaceNameInput.fill(workspaceName);

  const createWorkspaceButton = page.getByRole("button", {
    name: "Создать воркспейс",
  });
  await expect(createWorkspaceButton).toBeEnabled({ timeout: 5000 });
  await createWorkspaceButton.click();

  // Ждем редиректа на dashboard
  await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
    timeout: 15000,
  });

  // Дополнительная проверка что мы действительно на dashboard
  await expect(
    page.getByRole("heading", { name: "Панель управления" }),
  ).toBeVisible({ timeout: 10000 });
}
