import { expect, test } from "@playwright/test";
import { fillEmailPasswordForm, submitForm } from "../helpers/auth";

test.describe("Авторизация", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
  });

  test("отображает форму входа", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "С возвращением" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Продолжить с Google" }),
    ).toBeVisible();
  });

  test("переключение между табами Пароль и Код на email", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Пароль" })).toHaveAttribute(
      "data-state",
      "active",
    );

    await page.getByRole("tab", { name: "Код на email" }).click();
    await expect(
      page.getByRole("tab", { name: "Код на email" }),
    ).toHaveAttribute("data-state", "active");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Пароль", { exact: true })).not.toBeVisible();
  });

  test("показывает ошибку при пустом email", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();
    await submitForm(page);

    await expect(page.getByText("Неверный email адрес")).toBeVisible();
  });

  test("показывает ошибку при невалидном email", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();
    await page.getByLabel("Email").fill("invalid-email");
    await submitForm(page);

    await expect(page.getByText("Неверный email адрес")).toBeVisible();
  });

  test("показывает ошибку при коротком пароле", async ({ page }) => {
    await fillEmailPasswordForm(page, "test@example.com", "123");
    await submitForm(page);

    await expect(
      page.getByText("Пароль должен содержать минимум 8 символов"),
    ).toBeVisible();
  });

  test("отображает кнопку 'Забыли пароль?'", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();
    await expect(
      page.getByRole("link", { name: "Забыли пароль?" }),
    ).toBeVisible();
  });

  test("переход на страницу регистрации", async ({ page }) => {
    await page.getByRole("link", { name: "Зарегистрироваться" }).click();
    await expect(page).toHaveURL("/auth/signup");
  });

  test("кнопка входа показывает состояние загрузки", async ({ page }) => {
    await fillEmailPasswordForm(page, "test@example.com", "password123");

    const submitButton = page.getByRole("button", { name: "Войти" });
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(page.getByRole("button", { name: "Вход…" })).toBeVisible();
  });

  test("отправка OTP кода через email", async ({ page }) => {
    await page.getByRole("tab", { name: "Код на email" }).click();
    await page.getByLabel("Email").fill("test@example.com");

    await page.getByRole("button", { name: "Отправить код" }).click();

    await expect(
      page.getByRole("button", { name: "Отправка кода…" }),
    ).toBeVisible();
  });

  test("проверка доступности клавиатуры", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Пароль", { exact: true })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Забыли пароль?" }),
    ).toBeFocused();
  });

  test("проверка видимости фокуса", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();
    await page.getByLabel("Email").focus();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeFocused();
  });

  test("поддержка автозаполнения", async ({ page }) => {
    await page.getByRole("tab", { name: "Пароль" }).click();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    const passwordInput = page.getByLabel("Пароль", { exact: true });
    await expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  test("проверка размера кнопок для мобильных устройств", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const googleButton = page.getByRole("button", {
      name: "Продолжить с Google",
    });
    const box = await googleButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
