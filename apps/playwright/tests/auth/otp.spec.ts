import { expect, test } from "@playwright/test";

test.describe("OTP верификация", () => {
  test.beforeEach(async ({ page, context }) => {
    await page.goto("/auth/signin");

    await page.getByRole("tab", { name: "Код на email" }).click();
    await page.getByLabel("Email").fill("test@example.com");

    await context.addInitScript(() => {
      localStorage.setItem("otp_email", "test@example.com");
    });

    await page.goto("/auth/otp");
  });

  test("отображает форму OTP", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Введите код подтверждения" }),
    ).toBeVisible();
    await expect(
      page.getByText("Мы отправили 6-значный код на test@example.com"),
    ).toBeVisible();
  });

  test("отображает 6 полей для ввода кода", async ({ page }) => {
    const otpInputs = page.locator('[data-slot="input-otp-slot"]');
    await expect(otpInputs).toHaveCount(6);
  });

  test("автоматический переход между полями при вводе", async ({ page }) => {
    const firstInput = page.locator('[data-slot="input-otp-slot"]').first();
    await firstInput.click();
    await page.keyboard.type("1");

    const secondInput = page.locator('[data-slot="input-otp-slot"]').nth(1);
    await expect(secondInput).toBeFocused();
  });

  test("кнопка подтверждения изначально активна", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "Подтвердить" });
    await expect(submitButton).toBeEnabled();
  });

  test("отображает кнопку повторной отправки", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Отправить повторно" }),
    ).toBeVisible();
  });

  test("таймер обратного отсчета для повторной отправки", async ({ page }) => {
    await page.getByRole("button", { name: "Отправить повторно" }).click();

    await expect(
      page.getByRole("button", { name: /Отправить повторно \(\d+с\)/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Отправить повторно \(\d+с\)/ }),
    ).toBeDisabled();
  });

  test("автоматическая отправка при вводе 6 цифр", async ({ page }) => {
    const firstInput = page.locator('[data-slot="input-otp-slot"]').first();
    await firstInput.click();

    await page.keyboard.type("123456");

    await expect(page.getByRole("button", { name: "Проверка…" })).toBeVisible();
  });

  test("проверка доступности - навигация клавиатурой", async ({ page }) => {
    await page.keyboard.press("Tab");

    const firstInput = page.locator('[data-slot="input-otp-slot"]').first();
    await expect(firstInput).toBeFocused();
  });

  test("редирект на signin если нет email в localStorage", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/auth/otp");
    await page.waitForURL("/auth/signin");
  });

  test("проверка aria-label для полей OTP", async ({ page }) => {
    const otpLabel = page.getByText("Код подтверждения");
    await expect(otpLabel).toHaveClass(/sr-only/);
  });

  test("описание формы видимо", async ({ page }) => {
    await expect(
      page.getByText("Введите 6-значный код, отправленный на вашу почту."),
    ).toBeVisible();
  });

  test("кнопка повторной отправки показывает состояние загрузки", async ({
    page,
  }) => {
    const resendButton = page.getByRole("button", {
      name: "Отправить повторно",
    });
    await resendButton.click();

    await expect(page.getByRole("button", { name: "Отправка…" })).toBeVisible();
  });

  test("проверка размера полей ввода на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const firstInput = page.locator('[data-slot="input-otp-slot"]').first();
    const box = await firstInput.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });

  test("проверка inputmode для числового ввода", async ({ page }) => {
    const firstInput = page.locator('[data-slot="input-otp-slot"]').first();

    await expect(firstInput).toHaveAttribute("inputmode", "numeric");
  });
});
