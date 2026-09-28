import type { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/* ── Table root ── */
interface AppTableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

function AppTableRoot({ children, className = '', ...rest }: AppTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle">
      <table className={`w-full border-collapse text-sm ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

/* ── Head ── */
function AppTableHead({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
}

/* ── Body ── */
function AppTableBody({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

/* ── Row ── */
function AppTableRow({ children, className = '', ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-border-subtle last:border-b-0 hover:bg-marine-800/40 transition-colors ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

/* ── Header cell ── */
function AppTableTh({ children, className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`sticky top-0 whitespace-nowrap border-b border-border-strong bg-surface-raised px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

/* ── Data cell (default; use numeric for right-aligned metrics) ── */
function AppTableTd({ children, className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`whitespace-nowrap px-3 py-2.5 text-text-primary ${className}`} {...rest}>
      {children}
    </td>
  );
}

/* ── Numeric data cell: right-aligned, tabular figures ── */
function AppTableTdNumeric({
  children,
  className = '',
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-text-primary ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}

/* ── Numeric header cell ── */
function AppTableThNumeric({
  children,
  className = '',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`sticky top-0 whitespace-nowrap border-b border-border-strong bg-surface-raised px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

/**
 * Responsive, scrollable table with sticky header and optional numeric cells.
 */
export const AppTable = Object.assign(AppTableRoot, {
  Head: AppTableHead,
  Body: AppTableBody,
  Row: AppTableRow,
  Th: AppTableTh,
  Td: AppTableTd,
  TdNumeric: AppTableTdNumeric,
  ThNumeric: AppTableThNumeric,
});
