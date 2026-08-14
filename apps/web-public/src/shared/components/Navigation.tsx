import { Link } from '@tanstack/react-router';

const navItems = [
  { to: '/', label: 'Laman Utama' },
  { to: '/pasang-surut', label: 'Pasang Surut' },
  { to: '/cuaca', label: 'Cuaca' },
  { to: '/angin-ombak', label: 'Angin & Ombak' },
  { to: '/fasa-bulan', label: 'Fasa Bulan' },
  { to: '/matahari', label: 'Matahari' },
  { to: '/kalendar-operasi', label: 'Kalendar Operasi' },
  { to: '/stesen', label: 'Stesen' },
  { to: '/amaran-marin', label: 'Amaran Marin' },
  { to: '/perisikan-kapal', label: 'Perisikan Kapal' },
  { to: '/mengenai', label: 'Mengenai' },
] as const;

export function Navigation() {
  return (
    <nav aria-label="Navigasi utama" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="nav-link"
              activeProps={{ className: 'nav-link active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
