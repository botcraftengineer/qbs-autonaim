interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
