import { useState } from 'react';
import { Link } from '@tanstack/react-router';

const navItems: NavItem[] = [
  { to: '/', label: 'Laman Utama' },
  {
    label: 'Keadaan Marin',
    children: [
      { to: '/pasang-surut', label: 'Pasang Surut' },
      { to: '/cuaca', label: 'Cuaca' },
      { to: '/angin-ombak', label: 'Angin & Ombak' },
      { to: '/fasa-bulan', label: 'Fasa Bulan' },
      { to: '/matahari', label: 'Matahari' },
    ],
  },
  {
    label: 'Operasi',
    children: [
      { to: '/kalendar-operasi', label: 'Kalendar Operasi' },
      { to: '/stesen', label: 'Stesen' },
    ],
  },
  { to: '/amaran-marin', label: 'Amaran Marin' },
  { to: '/mengenai', label: 'Mengenai' },
];

type NavLeaf = { to: string; label: string };
type NavGroup = { label: string; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

function GroupMenu({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {group.label}
        <span className="ml-1 text-[10px] opacity-70" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg">
          {group.children.map((child) => (
            <li key={child.to}>
              <Link
                to={child.to}
                className="block px-3 py-2 text-sm text-text-secondary hover:bg-marine-800 hover:text-text-primary"
                activeProps={{ className: 'block px-3 py-2 text-sm text-ocean-400 bg-marine-800' }}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function Navigation() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="scrollbar-none hidden min-w-0 flex-1 overflow-x-auto md:block"
    >
      <ul className="flex w-max items-center gap-0.5">
        {navItems.map((item) =>
          isGroup(item) ? (
            <GroupMenu key={item.label} group={item} />
          ) : (
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
          ),
        )}
      </ul>
    </nav>
  );
}
