import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@selectio/ui";
import { MessageCircle } from "lucide-react";

interface ChatIndicatorProps {
  messageCount: number;
}

export function ChatIndicator({ messageCount }: ChatIndicatorProps) {
  if (messageCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 transition-colors hover:bg-blue-100">
            <MessageCircle className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">
              {messageCount}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Диалог активен</p>
          <p className="text-xs text-muted-foreground">
            Сообщений: {messageCount}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
