import { Link } from '@tanstack/react-router';
import { PageHeader } from './ui/PageHeader';
import { ErrorState } from './ui/ErrorState';
import { AppButton } from './ui/AppButton';

/**
 * TanStack Router's notFoundComponent — shown for any path that doesn't
 * match a registered route. Matches the app's ErrorState styling instead
 * of the router's bare default "Not Found" text.
 */
export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Halaman Tidak Dijumpai" subtitle="404" />
      <ErrorState
        title="Halaman Tidak Wujud"
        message="Pautan yang anda ikuti mungkin sudah tidak sah atau halaman telah dialihkan."
      />
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <AppButton variant="primary">Kembali ke Laman Utama</AppButton>
        </Link>
      </div>
    </div>
  );
}
