import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

/**
 * Санитизация HTML контента для защиты от XSS атак
 * Используется только на сервере через tRPC API
 */
export function sanitizeHtml(html: string): string {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);

  return purify.sanitize(html, {
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
