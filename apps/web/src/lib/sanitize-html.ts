import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: return as-is (will be sanitized on client)
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "code",
      "pre",
      "blockquote",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
