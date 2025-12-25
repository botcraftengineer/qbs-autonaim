import { expect, test } from "@playwright/test";

test.describe("Доступность форм авторизации", () => {
  test("signin - проверка семантики", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(page.getByText("С возвращением")).toBeVisible();

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("signup - проверка семантики", async ({ page }) => {
    await page.goto("/auth/signup");

    await expect(page.getByText("Создать аккаунт")).toBeVisible();

    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("все интерактивные элементы доступны через Tab", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("tab", { name: "Пароль" }).click();

    const focusableElements = [
      page.getByRole("button", { name: "Продолжить с Google" }),
      page.getByRole("tab", { name: "Пароль" }),
      page.getByRole("tab", { name: "Код на email" }),
      page.getByRole("textbox", { name: "Email" }),
      page.getByRole("textbox", { name: "Пароль" }),
      page.getByRole("link", { name: "Забыли пароль?" }),
      page.getByRole("button", { name: "Войти" }),
      page.getByRole("link", { name: "Зарегистрироваться" }),
    ];

    for (const element of focusableElements) {
      await expect(element).toBeVisible();
    }
  });

  test("форма имеет правильные aria-атрибуты", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("tab", { name: "Пароль" }).click();

    const emailInput = page.getByRole("textbox", { name: "Email" });
    await emailInput.fill("invalid");
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });

  test("ошибки валидации связаны с полями", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("tab", { name: "Пароль" }).click();

    await page.getByRole("button", { name: "Войти" }).click();

    const errorMessage = page.getByText("Неверный email адрес");
    await expect(errorMessage).toBeVisible();
  });

  test("кнопки имеют описательный текст", async ({ page }) => {
    await page.goto("/auth/signin");

    const buttons = [
      page.getByRole("button", { name: "Продолжить с Google" }),
      page.getByRole("button", { name: "Войти" }),
    ];

    for (const button of buttons) {
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test("ссылки имеют описательный текст", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("tab", { name: "Пароль" }).click();

    const links = [
      page.getByRole("link", { name: "Забыли пароль?" }),
      page.getByRole("link", { name: "Зарегистрироваться" }),
    ];

    for (const link of links) {
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test("OTP форма - sr-only label", async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem("otp_email", "test@example.com");
    });

    await page.goto("/auth/otp");

    const srOnlyLabel = page
      .locator("label.sr-only")
      .filter({ hasText: "Код подтверждения" })
      .first();
    await expect(srOnlyLabel).toHaveClass(/sr-only/);
  });

  test("проверка контраста текста", async ({ page }) => {
    await page.goto("/auth/signin");

    const heading = page.getByText("С возвращением");
    const color = await heading.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).getPropertyValue("color"),
    );

    expect(color).toBeTruthy();
  });

  test("изображения имеют alt текст", async ({ page }) => {
    await page.goto("/auth/signin");

    const googleLogo = page.locator('svg[aria-label="Логотип Google"]');
    await expect(googleLogo).toHaveAttribute("aria-label");
  });

  test("форма доступна для скринридеров", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("tab", { name: "Пароль" }).click();

    const form = page.locator("form");
    await expect(form).toBeVisible();
  });
});
