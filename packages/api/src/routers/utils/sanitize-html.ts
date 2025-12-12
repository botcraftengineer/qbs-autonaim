import DOMPurify from "isomorphic-dompurify";

/**
 * Санитизация HTML контента для защиты от XSS атак
 * Работает и на сервере, и на клиенте
 */
export function sanitizeHtml(html: string): string {
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
