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
    <div
      className={`prose prose-xs max-w-xs text-pretty px-3 py-1.5 text-center leading-snug transition-all prose-p:text-white prose-p:leading-relaxed prose-p:text-sm prose-headings:text-white prose-headings:text-sm prose-strong:text-white prose-a:cursor-alias prose-a:underline prose-a:decoration-solid prose-a:underline-offset-2 prose-a:text-blue-400 prose-a:font-semibold prose-a:text-sm prose-code:inline-block prose-code:leading-none prose-code:rounded-md prose-code:bg-neutral-800 prose-code:text-white prose-code:px-1 prose-code:py-0.5 text-white text-sm ${className || ""}`}
    >
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline  text-blue-400"
            />
          ),
          code: ({ node, ...props }) => (
            <code
              {...props}
              className="rounded-md bg-neutral-800 text-white px-1 py-0.5"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
