interface PageContainerProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageContainer({ title, description, children }: PageContainerProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-border-subtle pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {children}
    </div>
  );
}
