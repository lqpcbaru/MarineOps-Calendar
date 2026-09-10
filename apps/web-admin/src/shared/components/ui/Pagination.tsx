import { AppButton } from './AppButton';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-text-secondary" aria-live="polite">
        Memaparkan {from}–{to} daripada {total}
      </p>
      <div className="flex items-center gap-2">
        <AppButton variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Sebelum
        </AppButton>
        <span className="text-sm text-text-secondary">
          Halaman {page} / {totalPages}
        </span>
        <AppButton
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Seterusnya
        </AppButton>
      </div>
    </nav>
  );
}
