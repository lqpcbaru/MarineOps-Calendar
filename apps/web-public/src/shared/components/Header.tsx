import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Navigation } from './Navigation';

const mobileNavItems = [
  { to: '/', label: 'Laman Utama' },
  { to: '/pasang-surut', label: 'Pasang Surut' },
  { to: '/cuaca', label: 'Cuaca' },
  { to: '/angin-ombak', label: 'Angin & Ombak' },
  { to: '/fasa-bulan', label: 'Fasa Bulan' },
  { to: '/matahari', label: 'Matahari' },
  { to: '/kalendar-operasi', label: 'Kalendar Operasi' },
  { to: '/stesen', label: 'Stesen' },
  { to: '/amaran-marin', label: 'Amaran Marin' },
  { to: '/mengenai', label: 'Mengenai' },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-marine-700 bg-marine-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2" aria-label="MarineOps Hub — Laman Utama">
              <svg
                className="h-8 w-8 text-ocean-400"
                viewBox="0 0 32 32"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4c5.514 0 10 4.486 10 10s-4.486 10-10 10S6 21.514 6 16 10.486 6 16 6zm-2 6v8l6-4-6-4z" />
              </svg>
              <span className="text-lg font-bold text-text-primary">
                Marine<span className="text-ocean-400">Ops</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <Navigation />

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-text-secondary hover:bg-marine-800 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:ring-offset-2 focus:ring-offset-marine-900 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <nav id="mobile-menu" aria-label="Navigasi mudah alih" className="border-t border-marine-700 md:hidden">
          <ul className="space-y-1 px-4 py-3">
            {mobileNavItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="nav-link block w-full"
                  activeProps={{ className: 'nav-link active block w-full' }}
                  activeOptions={{ exact: item.to === '/' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
