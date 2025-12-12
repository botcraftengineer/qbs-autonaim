"use server";

import { sanitizeHtml } from "~/lib/sanitize-html";

export async function sanitizeHtmlAction(html: string): Promise<string> {
  return sanitizeHtml(html);
}
