import { expect, test } from "@playwright/test";
import { fillEmailPasswordForm, submitForm } from "../helpers/auth";

test.describe("Регистрация", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signup");
  });

  test("отображает форму регистрации", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Создать аккаунт" }),
    ).toBeVisible();
    await expect(
      page.getByText("Выберите предпочитаемый способ регистрации"),
    ).toBeVisible();
  });

  test("переключение между табами", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Пароль" })).toHaveAttribute(
      "data-state",
      "active",
    );

    await page.getByRole("tab", { name: "Код на email" }).click();
    await expect(
      page.getByRole("tab", { name: "Код на email" }),
    ).toHaveAttribute("data-state", "active");
  });

  test("валидация email", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();
    await page.getByLabel("Email").fill("invalid");
    await submitForm(page);

    await expect(page.getByText("Неверный email адрес")).toBeVisible();
  });

  test("валидация пароля - минимальная длина", async ({ page }) => {
    await fillEmailPasswordForm(page, "test@example.com", "short");
    await submitForm(page);

    await expect(
      page.getByText("Пароль должен содержать минимум 8 символов"),
    ).toBeVisible();
  });

  test("кнопка регистрации показывает состояние загрузки", async ({ page }) => {
    await fillEmailPasswordForm(page, "newuser@example.com", "password123");

    const submitButton = page.getByRole("button", { name: "Создать аккаунт" });
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Создание аккаунта…" }),
    ).toBeVisible();
  });

  test("переход на страницу входа", async ({ page }) => {
    await page.getByRole("link", { name: "Войти" }).click();
    await expect(page).toHaveURL("/auth/signin");
  });

  test("отображает кнопку Google OAuth", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test("проверка autocomplete для нового пароля", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    const passwordInput = page.getByLabel("Пароль", { exact: true });
    await expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
  });

  test("проверка доступности - навигация клавиатурой", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Пароль", { exact: true })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Создать аккаунт" }),
    ).toBeFocused();
  });

  test("проверка размера кнопок на мобильных", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const submitButton = page.getByRole("button", { name: "Создать аккаунт" });
    const box = await submitButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("отправка OTP через email при регистрации", async ({ page }) => {
    await page.getByRole("tab", { name: "Код на email" }).click();
    await page.getByLabel("Email").fill("newuser@example.com");

    await page.getByRole("button", { name: "Отправить код" }).click();

    await expect(
      page.getByRole("button", { name: "Отправка кода…" }),
    ).toBeVisible();
  });

  test("проверка spellcheck отключен для email", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("spellcheck", "false");
  });

  test("проверка placeholder для email", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("placeholder", "m@example.com");
  });

  test("проверка типа input для email", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("type", "email");
  });
});
