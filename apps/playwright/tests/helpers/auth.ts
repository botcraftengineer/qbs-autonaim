import type { Page } from "@playwright/test";

export async function fillEmailPasswordForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByRole("tab", { name: "Пароль" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
}

export async function fillEmailOtpForm(page: Page, email: string) {
  await page.getByRole("tab", { name: "Код на email" }).click();
  await page.getByLabel("Email").fill(email);
}

export async function submitForm(page: Page) {
  await page.getByRole("button", { name: /войти|создать аккаунт/i }).click();
}

export async function waitForAuthSuccess(page: Page) {
  await page.waitForURL(/\/(dashboard|onboarding|organization)/);
}

export async function getOtpFromEmail(email: string): Promise<string> {
  // TODO: Интеграция с email провайдером для получения OTP
  // Пока возвращаем моковое значение
  return "123456";
}
