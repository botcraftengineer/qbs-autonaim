interface ChatHeaderProps {
  candidateName: string;
  candidateEmail?: string;
  avatarUrl?: string;
}

export function ChatHeader({ candidateName, candidateEmail }: ChatHeaderProps) {
  return (
    <div className="border-b px-6 py-4">
      <h1 className="text-xl font-semibold">{candidateName}</h1>
      {candidateEmail && (
        <p className="text-sm text-muted-foreground">{candidateEmail}</p>
      )}
    </div>
  );
}
