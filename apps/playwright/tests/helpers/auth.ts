import type { Page } from "@playwright/test";

export async function fillEmailPasswordForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByRole("tab", { name: "Пароль" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Пароль" }).fill(password);
}

export async function fillEmailOtpForm(page: Page, email: string) {
  await page.getByRole("tab", { name: "Код на email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
}

export async function submitSignInForm(page: Page) {
  await page.getByRole("button", { name: "Войти" }).click();
}

export async function submitSignUpForm(page: Page) {
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
}

export async function waitForAuthSuccess(page: Page) {
  await page.waitForURL(/\/(dashboard|onboarding|organization)/);
}

export async function getOtpFromEmail(email: string): Promise<string> {
  // TODO: Интеграция с email провайдером для получения OTP
  // Пока возвращаем моковое значение
  return "123456";
}
