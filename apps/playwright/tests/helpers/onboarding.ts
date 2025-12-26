import type { Page } from "@playwright/test";

export async function completeOnboarding(
  page: Page,
  orgName = "Test Org",
  workspaceName = "Test Workspace",
) {
  // Ждем загрузки страницы онбординга
  await page.waitForTimeout(2000);

  // Проверяем, находимся ли мы на странице онбординга
  const currentUrl = page.url();
  if (!currentUrl.includes("/onboarding")) {
    return;
  }

  // Создаем организацию
  const orgNameInput = page.getByRole("textbox", {
    name: "Название организации",
  });

  if (await orgNameInput.isVisible().catch(() => false)) {
    await orgNameInput.fill(orgName);

    // Генерируем уникальный slug
    const timestamp = Date.now();
    const orgSlugInput = page.getByRole("textbox", {
      name: "Slug организации",
    });
    await orgSlugInput.fill(`test-org-${timestamp}`);

    await page.getByRole("button", { name: "Создать организацию" }).click();
    await page.waitForTimeout(3000);
  }

  // Создаем workspace вместо пропуска
  const workspaceNameInput = page.getByRole("textbox", {
    name: "Название воркспейса",
  });

  if (await workspaceNameInput.isVisible().catch(() => false)) {
    await workspaceNameInput.fill(workspaceName);
    await page.getByRole("button", { name: "Создать воркспейс" }).click();
    await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
      timeout: 15000,
    });
  }
}
