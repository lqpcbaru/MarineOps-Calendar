export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-marine-700 bg-marine-900/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              MarineOps Hub
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Portal maklumat marin untuk perancangan operasi selamat dan cekap.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              Pautan Pantas
            </h3>
            <ul className="mt-2 space-y-1">
              <li>
                <a href="/pasang-surut" className="text-sm text-text-secondary hover:text-ocean-400 transition-colors">
                  Pasang Surut
                </a>
              </li>
              <li>
                <a href="/cuaca" className="text-sm text-text-secondary hover:text-ocean-400 transition-colors">
                  Cuaca
                </a>
              </li>
              <li>
                <a href="/amaran-marin" className="text-sm text-text-secondary hover:text-ocean-400 transition-colors">
                  Amaran Marin
                </a>
              </li>
              <li>
                <a href="/stesen" className="text-sm text-text-secondary hover:text-ocean-400 transition-colors">
                  Stesen
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              Maklumat
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Data cuaca, pasang surut, dan maklumat marin dikemas kini secara berkala.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-marine-700 pt-6">
          <p className="text-center text-sm text-text-muted">
            &copy; {year} MarineOps Hub. Hak cipta terpelihara.
          </p>
        </div>
      </div>
    </footer>
  );
}
