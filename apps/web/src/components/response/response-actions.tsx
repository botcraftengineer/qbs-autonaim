"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@selectio/ui";
import {
  IconDots,
  IconExternalLink,
  IconMessage,
  IconSend,
  IconStar,
} from "@tabler/icons-react";

interface ResponseActionsProps {
  responseId: string;
  resumeUrl: string;
  candidateName?: string | null;
  hasGreeting?: boolean;
}

export function ResponseActions({
  responseId,
  resumeUrl,
  candidateName,
  hasGreeting = false,
}: ResponseActionsProps) {
  const handleRate = () => {
    // TODO: Реализовать оценку кандидата
    console.log("Оценить кандидата:", responseId);
  };

  const handleSendGreeting = () => {
    // TODO: Реализовать отправку приветственного сообщения
    console.log("Отправить приветствие:", responseId);
  };

  const handleOpenResume = () => {
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenChat = () => {
    // TODO: Реализовать переход в чат
    console.log("Открыть чат с:", candidateName);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleRate}>
          <IconStar className="h-4 w-4" />
          Оценить кандидата
        </DropdownMenuItem>

        {hasGreeting && (
          <DropdownMenuItem onClick={handleSendGreeting}>
            <IconSend className="h-4 w-4" />
            Отправить приветствие
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleOpenChat}>
          <IconMessage className="h-4 w-4" />
          Перейти в чат
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleOpenResume}>
          <IconExternalLink className="h-4 w-4" />
          Открыть резюме на HH.ru
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
