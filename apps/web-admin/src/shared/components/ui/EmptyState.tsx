export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <div className="card p-6 text-center text-sm text-text-secondary">{message}</div>;
}
