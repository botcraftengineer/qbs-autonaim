import { getIntegrationCredentials } from "@qbs-autonaim/db";
import type { Log } from "crawlee";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { loadCookies, performLogin } from "./auth";
import { HH_CONFIG } from "./config";

puppeteer.use(StealthPlugin());

export interface BrowserSetupOptions {
  workspaceId: string;
  headless?: boolean;
}

export interface AuthenticatedBrowser {
  browser: Browser;
  page: Page;
  credentials: {
    email: string;
    password: string;
  };
}

/**
 * Universal function to setup browser with authentication
 * Handles cookies loading, validation, and re-authentication if needed
 */
export async function setupAuthenticatedBrowser(
  options: BrowserSetupOptions,
): Promise<AuthenticatedBrowser> {
  const { workspaceId, headless = HH_CONFIG.puppeteer.headless } = options;

  // Get credentials
  const credentials = await getIntegrationCredentials("hh", workspaceId);
  console.log(credentials);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("HH credentials not found in integrations");
  }

  const { email, password } = credentials;

  // Load saved cookies
  const savedCookies = await loadCookies("hh", workspaceId);

  // Launch browser
  const browser = await puppeteer.launch({
    headless,
    args: HH_CONFIG.puppeteer.args,
    ignoreDefaultArgs: HH_CONFIG.puppeteer.ignoreDefaultArgs,
    slowMo: HH_CONFIG.puppeteer.slowMo,
  });

  const page = await browser.newPage();

  // Setup anti-detection
  await setupAntiDetection(page);

  // Restore cookies if available
  if (savedCookies && savedCookies.length > 0) {
    console.log(`🍪 Restoring ${savedCookies.length} saved cookies...`);
    await page.setCookie(...(savedCookies as never[]));
  } else {
    console.log("ℹ️ No saved cookies found, authentication will be required");
  }

  return {
    browser,
    page,
    credentials: { email, password },
  };
}

/**
 * Setup anti-detection measures for the page
 */
async function setupAntiDetection(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    Object.defineProperty(navigator, "languages", {
      get: () => ["ru-RU", "ru", "en-US", "en"],
    });

    (window as { chrome?: unknown }).chrome = {
      runtime: {},
    };

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          } as PermissionStatus)
        : originalQuery(parameters);
  });

  await page.setUserAgent(HH_CONFIG.userAgent);

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
}

/**
 * Check if authentication is required and perform login if needed
 * Returns true if login was performed
 */
export async function ensureAuthenticated(
  page: Page,
  email: string,
  password: string,
  workspaceId: string,
  log?: Log,
): Promise<boolean> {
  const loginInput = await page.$('input[type="text"][name="username"]');

  if (loginInput) {
    const logMessage =
      "⚠️ Cookies invalid or missing. Performing authentication...";
    if (log) {
      log.warning(logMessage);
    } else {
      console.log(logMessage);
    }

    await performLogin(
      page,
      log || createConsoleLog(),
      email,
      password,
      workspaceId,
    );

    // Wait for page to stabilize after login
    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    const successMessage = "✅ Authentication completed successfully";
    if (log) {
      log.info(successMessage);
    } else {
      console.log(successMessage);
    }

    return true;
  }

  const validMessage = "✅ Cookies valid. Authentication not required.";
  if (log) {
    log.info(validMessage);
  } else {
    console.log(validMessage);
  }

  return false;
}

/**
 * Navigate to URL and ensure authentication is still valid
 * Re-authenticates if needed after navigation
 */
export async function navigateWithAuth(
  page: Page,
  url: string,
  email: string,
  password: string,
  workspaceId: string,
  log?: Log,
): Promise<void> {
  const logMessage = `🔗 Navigating to: ${url}`;
  if (log) {
    log.info(logMessage);
  } else {
    console.log(logMessage);
  }

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: HH_CONFIG.timeouts.navigation,
  });

  await page.waitForNetworkIdle({
    timeout: HH_CONFIG.timeouts.networkIdle,
  });

  // Check if authentication is still valid after navigation
  const loginInputAfterNav = await page.$(
    'input[type="text"][name="username"]',
  );

  if (loginInputAfterNav) {
    const warningMessage = "⚠️ Re-authentication required after navigation";
    if (log) {
      log.warning(warningMessage);
    } else {
      console.log(warningMessage);
    }

    await performLogin(
      page,
      log || createConsoleLog(),
      email,
      password,
      workspaceId,
    );

    // Navigate again after re-login
    const retryMessage = `🔗 Retrying navigation to: ${url}`;
    if (log) {
      log.info(retryMessage);
    } else {
      console.log(retryMessage);
    }

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });
  }
}

/**
 * Create a simple console-based log object for compatibility
 */
function createConsoleLog(): Log {
  return {
    info: (message: string) => console.log(message),
    warning: (message: string) => console.warn(message),
    error: (message: string) => console.error(message),
    debug: (message: string) => console.debug(message),
  } as Log;
}
