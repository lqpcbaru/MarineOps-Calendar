import type { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/* ── Table root ── */
interface AppTableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

function AppTableRoot({ children, className = '', ...rest }: AppTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-marine-700">
      <table className={`w-full border-collapse text-sm ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

/* ── Head ── */
interface AppTableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

function AppTableHead({ children, className = '', ...rest }: AppTableHeadProps) {
  return (
    <thead className={`bg-marine-800 ${className}`} {...rest}>
      {children}
    </thead>
  );
}

/* ── Body ── */
interface AppTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

function AppTableBody({ children, className = '', ...rest }: AppTableBodyProps) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

/* ── Row ── */
interface AppTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

function AppTableRow({ children, className = '', ...rest }: AppTableRowProps) {
  return (
    <tr className={`border-b border-marine-700 last:border-b-0 hover:bg-marine-800/50 transition-colors ${className}`} {...rest}>
      {children}
    </tr>
  );
}

/* ── Header cell ── */
interface AppTableThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

function AppTableTh({ children, className = '', ...rest }: AppTableThProps) {
  return (
    <th
      className={`sticky top-0 whitespace-nowrap border-b-2 border-marine-700 bg-marine-800 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

/* ── Data cell ── */
interface AppTableTdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

function AppTableTd({ children, className = '', ...rest }: AppTableTdProps) {
  return (
    <td className={`whitespace-nowrap px-3 py-2.5 text-text-primary ${className}`} {...rest}>
      {children}
    </td>
  );
}

/**
 * Responsive, scrollable table with sticky header.
 *
 * Usage:
 *   <AppTable>
 *     <AppTable.Head><AppTable.Row><AppTable.Th>Col</AppTable.Th></AppTable.Row></AppTable.Head>
 *     <AppTable.Body><AppTable.Row><AppTable.Td>Data</AppTable.Td></AppTable.Row></AppTable.Body>
 *   </AppTable>
 */
export const AppTable = Object.assign(AppTableRoot, {
  Head: AppTableHead,
  Body: AppTableBody,
  Row: AppTableRow,
  Th: AppTableTh,
  Td: AppTableTd,
});
