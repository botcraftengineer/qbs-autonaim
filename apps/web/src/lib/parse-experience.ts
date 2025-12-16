export function extractExperienceSummary(html: string): string {
  if (!html) return "Не указан";

  if (!html.includes("<") && !html.includes(">")) {
    return html.length > 30 ? `${html.slice(0, 30)}…` : html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const yearPattern = /(\d+)\s*(год|лет|года|years?|yrs?)/i;
  const text = doc.body.textContent || "";

  const yearMatch = text.match(yearPattern);
  if (yearMatch) {
    return yearMatch[0];
  }

  const datePattern = /(\d{4})\s*[-–—]\s*(\d{4}|настоящее время|present|now)/i;
  const dateMatch = text.match(datePattern);
  if (dateMatch?.[1] && dateMatch[2]) {
    const startYear = Number.parseInt(dateMatch[1], 10);
    const endYear = dateMatch[2].match(/\d{4}/)
      ? Number.parseInt(dateMatch[2], 10)
      : new Date().getFullYear();
    const years = endYear - startYear;
    if (years <= 0) return dateMatch[0];

    const lastTwoDigits = years % 100;
    const lastDigit = years % 10;

    let yearWord: string;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      yearWord = "лет";
    } else if (lastDigit === 1) {
      yearWord = "год";
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      yearWord = "года";
    } else {
      yearWord = "лет";
    }

    return `${years} ${yearWord}`;
  }

  const firstHeading = doc.querySelector("h2, h3, h4, strong");
  if (firstHeading?.textContent) {
    const headingText = firstHeading.textContent.trim();
    return headingText.length > 30
      ? `${headingText.slice(0, 30)}…`
      : headingText;
  }

  const firstParagraph = doc.querySelector("p, li");
  if (firstParagraph?.textContent) {
    const paraText = firstParagraph.textContent.trim();
    return paraText.length > 30 ? `${paraText.slice(0, 30)}…` : paraText;
  }

  const cleanText = text.trim().replace(/\s+/g, " ");
  return cleanText.length > 30
    ? `${cleanText.slice(0, 30)}…`
    : cleanText || "Не указан";
}
