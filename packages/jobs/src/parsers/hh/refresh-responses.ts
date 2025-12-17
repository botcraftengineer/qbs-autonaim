import {
  ensureAuthenticated,
  navigateWithAuth,
  setupAuthenticatedBrowser,
} from "./browser-setup";
import { closeBrowserSafely } from "./browser-utils";
import { HH_CONFIG } from "./config";
import { parseResponses } from "./response-parser";

/**
 * Parse only new responses for a specific vacancy
 * Does not parse the vacancy itself, only updates the response list
 */
export async function refreshVacancyResponses(
  vacancyId: string,
  workspaceId: string,
): Promise<{ newCount: number }> {
  console.log(`🔄 Refreshing responses for vacancy ${vacancyId}...`);

  // Setup authenticated browser with universal function
  const { browser, page, credentials } = await setupAuthenticatedBrowser({
    workspaceId,
  });

  const { email, password } = credentials;

  try {
    // Navigate to login page and check authentication
    console.log("🔗 Navigating to login page...");
    await page.goto(HH_CONFIG.urls.login, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    // Ensure authentication (will login if needed)
    await ensureAuthenticated(page, email, password, workspaceId);

    // Navigate to responses page with auth check
    const responsesUrl = `https://hh.ru/employer/vacancyresponses?vacancyId=${vacancyId}&order=DATE`;
    await navigateWithAuth(page, responsesUrl, email, password, workspaceId);

    // Parse responses
    console.log(`📋 Parsing responses for vacancy ${vacancyId}...`);
    const result = await parseResponses(page, responsesUrl, vacancyId);

    console.log(`✅ Responses for vacancy ${vacancyId} updated successfully`);
    console.log(`📊 New responses: ${result.newCount}`);

    await new Promise((resolve) =>
      setTimeout(resolve, HH_CONFIG.delays.afterParsing),
    );

    console.log("\n✨ Response refresh completed!");

    return { newCount: result.newCount };
  } catch (error) {
    console.error("❌ Error refreshing responses:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}
