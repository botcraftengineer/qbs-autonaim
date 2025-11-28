interface ChatHeaderProps {
  candidateName: string | null;
  chatId: string;
}

export function ChatHeader({ candidateName, chatId }: ChatHeaderProps) {
  return (
    <div className="border-b px-6 py-4">
      <h1 className="text-xl font-semibold">{candidateName}</h1>
      <p className="text-sm text-muted-foreground">@{chatId}</p>
    </div>
  );
}
