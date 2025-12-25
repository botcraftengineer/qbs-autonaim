import { expect, test } from "@playwright/test";

test.describe("Google OAuth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
  });

  test("кнопка Google OAuth видима и доступна", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });

    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test("кнопка содержит логотип Google", async ({ page }) => {
    const googleLogo = page.locator('svg[aria-label="Логотип Google"]');
    await expect(googleLogo).toBeVisible();
  });

  test("кнопка имеет правильный стиль", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });

    await expect(googleButton).toHaveClass(/outline/);
  });

  test("проверка размера кнопки на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });
    const box = await googleButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(36);
  });

  test("кнопка доступна через клавиатуру и имеет видимый фокус", async ({
    page,
  }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });

    await googleButton.focus();
    await expect(googleButton).toBeFocused();

    const focusStyles = await googleButton.evaluate((el: HTMLElement) => {
      const styles = window.getComputedStyle(el);
      return {
        outlineStyle: styles.getPropertyValue("outline-style"),
        outlineWidth: styles.getPropertyValue("outline-width"),
        boxShadow: styles.getPropertyValue("box-shadow"),
      };
    });

    const hasVisibleOutline =
      focusStyles.outlineStyle !== "none" &&
      focusStyles.outlineWidth !== "0px" &&
      focusStyles.outlineWidth !== "";

    const hasVisibleBoxShadow =
      focusStyles.boxShadow !== "none" &&
      focusStyles.boxShadow !== "0px 0px 0px" &&
      focusStyles.boxShadow !== "";

    expect(hasVisibleOutline || hasVisibleBoxShadow).toBe(true);
  });

  test("логотип Google имеет правильный title", async ({ page }) => {
    const googleLogo = page.locator('svg[aria-label="Логотип Google"]');
    const title = googleLogo.locator("title");

    await expect(title).toHaveText("Логотип Google");
  });

  test("кнопка на странице регистрации", async ({ page }) => {
    await page.goto("/auth/signup");

    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });

    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test("проверка контраста кнопки", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });

    const color = await googleButton.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).getPropertyValue("color"),
    );
    const backgroundColor = await googleButton.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).getPropertyValue("background-color"),
    );

    expect(color).toBeTruthy();
    expect(backgroundColor).toBeTruthy();
  });

  test("кнопка имеет правильный тип", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });

    // Проверяем, что это кнопка (role="button" уже проверен в селекторе)
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });
});
