import type { ErrorComponentProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { PageHeader } from './ui/PageHeader';
import { ErrorState } from './ui/ErrorState';
import { AppButton } from './ui/AppButton';

/**
 * TanStack Router's errorComponent — the last line of defence for an
 * unexpected render/loader error (a real bug, not a handled fetch
 * failure — those already show ErrorState inline via each page's own
 * query error state). Without this, React unmounts the tree on an
 * uncaught error and the visitor sees a blank white page.
 */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'Ralat tidak dijangka berlaku.';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Ralat Aplikasi" />
      <ErrorState title="Sesuatu Telah Tidak Kena" message={message} onRetry={reset} />
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <AppButton variant="secondary">Kembali ke Laman Utama</AppButton>
        </Link>
      </div>
    </div>
  );
}
