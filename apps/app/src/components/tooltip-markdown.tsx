import ReactMarkdown from "react-markdown";

interface TooltipMarkdownProps {
  className?: string;
  children: string;
}

export const TooltipMarkdown = ({
  className,
  children,
}: TooltipMarkdownProps) => {
  return (
    <div className={`prose prose-sm max-w-xs text-pretty px-4 py-2 text-center leading-snug transition-all prose-p:text-gray-900 prose-headings:text-gray-900 prose-a:cursor-alias prose-a:underline prose-a:decoration-dotted prose-a:underline-offset-2 prose-a:text-blue-600 prose-code:inline-block prose-code:leading-none prose-code:rounded-md prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 ${className || ""}`}>
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          code: ({ node, ...props }) => (
            <code {...props} className="rounded-md bg-neutral-100 px-1 py-0.5" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};