interface TypingIndicatorProps {
  typingUsers: Map<string, string>;
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.size === 0) return null;

  const names = Array.from(typingUsers.values());
  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.join(", ")} are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[11px] text-muted-foreground">{text}</span>
    </div>
  );
};

export default TypingIndicator;
