interface PageContainerProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageContainer({ title, description, children }: PageContainerProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 text-lg text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
