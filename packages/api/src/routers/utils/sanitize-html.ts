import sanitize from "sanitize-html";

/**
 * Санитизация HTML контента для защиты от XSS атак
 * Работает и на сервере, и на клиенте
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
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
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
  });
}
