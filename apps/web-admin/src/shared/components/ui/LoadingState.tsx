export interface LoadingStateProps {
  lines?: number;
}

export function LoadingState({ lines = 4 }: LoadingStateProps) {
  return (
    <div role="status" aria-label="Memuatkan..." className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded bg-marine-700" />
      ))}
      <span className="sr-only">Memuatkan...</span>
    </div>
  );
}
