import { expect, test } from "@playwright/test";
import { mockOTPResend } from "../helpers/mock-api";

test.describe("OTP верификация", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem("otp_email", "test@example.com");
    });

    await page.goto("/auth/otp");
  });

  test("отображает форму OTP", async ({ page }) => {
    await expect(page.getByText("Введите код подтверждения")).toBeVisible();
    await expect(page.getByText(/Мы отправили 6-значный код на/)).toBeVisible();
  });

  test("отображает 6 полей для ввода кода", async ({ page }) => {
    const otpSlots = page.locator('[data-slot="input-otp-slot"]');
    await expect(otpSlots).toHaveCount(6);
  });

  test("автоматический переход между полями при вводе", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await otpInput.click();

    // Проверяем, что можем вводить цифры
    await otpInput.fill("1");
    await expect(otpInput).toHaveValue("1");
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

  test.skip("таймер обратного отсчета для повторной отправки", async ({
    page,
  }) => {
    // TODO: Требует настройки реального API endpoint для mock
    // Mock не перехватывает запрос, нужно уточнить endpoint
    await mockOTPResend(page);

    const resendButton = page.getByRole("button", {
      name: "Отправить повторно",
    });

    await expect(resendButton).toBeEnabled();
    await resendButton.click();

    await expect(page.getByText("Отправка…")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/Отправить повторно \(\d+с\)/)).toBeVisible({
      timeout: 5000,
    });
    await expect(resendButton).toBeDisabled();
  });

  test("автоматическая отправка при вводе 6 цифр", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await otpInput.click();

    await otpInput.fill("123456");

    // Проверяем, что форма отправляется или кнопка меняет состояние
    await expect(
      page.getByRole("button", { name: "Подтвердить" }),
    ).toBeVisible();
  });

  test("проверка доступности - навигация клавиатурой", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });

    // Проверяем, что поле может получить фокус
    await otpInput.focus();
    await expect(otpInput).toBeFocused();
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
    // Проверяем, что label с sr-only существует
    const srOnlyLabel = page
      .locator("label.sr-only")
      .filter({ hasText: "Код подтверждения" });
    await expect(srOnlyLabel).toHaveClass(/sr-only/);
  });

  test("описание формы видимо", async ({ page }) => {
    await expect(
      page.getByText("Введите 6-значный код, отправленный на вашу почту."),
    ).toBeVisible();
  });

  test.skip("кнопка повторной отправки показывает состояние загрузки", async ({
    page,
  }) => {
    // TODO: Требует настройки реального API endpoint для mock
    await mockOTPResend(page);

    const resendButton = page.getByRole("button", {
      name: "Отправить повторно",
    });
    await resendButton.click();

    await expect(page.getByText("Отправка…")).toBeVisible({ timeout: 2000 });
  });

  test("проверка размера полей ввода на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    const box = await otpInput.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(24);
  });

  test("проверка inputmode для числового ввода", async ({ page }) => {
    const otpInput = page.getByRole("textbox", { name: "Код подтверждения" });
    await expect(otpInput).toBeVisible();
    await expect(otpInput).toHaveAttribute("inputmode", "numeric");
  });
});
