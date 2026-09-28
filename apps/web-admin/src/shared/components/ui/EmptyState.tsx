export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-secondary">
      {message}
    </div>
  );
}
