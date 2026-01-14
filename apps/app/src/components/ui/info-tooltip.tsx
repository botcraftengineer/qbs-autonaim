import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { TooltipMarkdown } from "./tooltip-markdown";

interface InfoTooltipProps
  extends Omit<TooltipPrimitive.TooltipContentProps, "content"> {
  content: string;
}

export function InfoTooltip({ content, ...props }: InfoTooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        <HelpCircle className="h-4 w-4 text-neutral-500" />
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={8}
          side="top"
          className="animate-slide-up-fade pointer-events-auto z-99 items-center overflow-hidden rounded-xl border border-neutral-800 bg-black shadow-sm"
          collisionPadding={0}
          {...props}
        >
          <TooltipMarkdown className="p-0">
            {content}
          </TooltipMarkdown>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}