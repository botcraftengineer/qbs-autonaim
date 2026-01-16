import type { Page, Route } from "@playwright/test";

/**
 * Настройка mock для auth API
 */
export async function mockAuthAPI(page: Page) {
  // Mock для отправки OTP кода
  await page.route("**/api/auth/signin", async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Если это запрос на отправку OTP
    if (postData?.email && !postData?.otp) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "OTP sent successfully",
        }),
      });
      return;
    }

    // Если это верификация OTP
    if (postData?.otp) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: {
            id: "mock-user-id",
            email: postData.email,
          },
        }),
      });
      return;
    }

    // Для остальных случаев пропускаем запрос
    await route.continue();
  });
}

/**
 * Mock для успешной отправки OTP
 */
export async function mockOTPResend(page: Page) {
  await page.route("**/api/auth/signin", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "OTP resent successfully",
      }),
    });
  });
}

/**
 * Mock для ошибки отправки OTP
 */
export async function mockOTPResendError(page: Page) {
  await page.route("**/api/auth/signin", async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Failed to send OTP",
      }),
    });
  });
}
