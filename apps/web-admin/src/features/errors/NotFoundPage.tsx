import { Link } from '@tanstack/react-router';
import { AppCard } from '../../shared/components/ui/AppCard';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <AppCard>
        <h1 className="text-xl font-semibold text-text-primary">Halaman Tidak Dijumpai</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Halaman yang anda cari tidak wujud atau telah dipindahkan.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-text-accent underline">
          Kembali ke papan pemuka
        </Link>
      </AppCard>
    </div>
  );
}
