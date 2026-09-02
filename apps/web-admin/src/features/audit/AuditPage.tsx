import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AppCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  SelectField,
  StatusBadge,
  TextField,
} from '../../shared/components';
import { listAudit } from './audit.api';
import type { AuditEntry } from './audit.api';

const PAGE_SIZE = 20;

/** Entity types the audited use-cases actually emit. */
const ENTITY_TYPES = ['user', 'role', 'station'] as const;

/**
 * Renders the audit payload.
 *
 * The API already whitelists what goes in here (the use-cases pick specific
 * fields; create-user records email/name/roleIds and never the password),
 * but this is the one screen whose whole job is displaying stored data, so
 * it defends in depth: any key that looks credential-shaped is redacted
 * rather than printed, in case a future use-case records something careless.
 */
const SENSITIVE_KEY = /pass|secret|token|hash|credential|authorization|apikey|api_key/i;

function renderPayload(payload: Record<string, unknown> | null): string {
  if (!payload || Object.keys(payload).length === 0) return '—';
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    safe[key] = SENSITIVE_KEY.test(key) ? '[ditapis]' : value;
  }
  return JSON.stringify(safe);
}

function ActionBadge({ action }: { action: string }) {
  const tone = action.endsWith('.create')
    ? 'safe'
    : action.endsWith('.delete') || action.endsWith('.archive') || action.endsWith('.disable')
      ? 'danger'
      : 'caution';
  return <StatusBadge tone={tone}>{action}</StatusBadge>;
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <tr>
      <td className="whitespace-nowrap text-text-secondary">
        {new Date(entry.at).toLocaleString('ms-MY')}
      </td>
      <td>
        <ActionBadge action={entry.action} />
      </td>
      <td className="text-text-secondary">{entry.entityType}</td>
      <td className="font-mono text-xs text-text-muted">{entry.entityId}</td>
      <td className="font-mono text-xs text-text-muted">{entry.actorId ?? 'sistem'}</td>
      <td
        className="max-w-xs truncate font-mono text-xs text-text-muted"
        title={renderPayload(entry.payload)}
      >
        {renderPayload(entry.payload)}
      </td>
    </tr>
  );
}

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const auditQuery = useQuery({
    queryKey: ['admin-audit', page, PAGE_SIZE, entityType, action],
    queryFn: () =>
      listAudit({
        page,
        pageSize: PAGE_SIZE,
        entityType: entityType || undefined,
        action: action || undefined,
      }),
  });

  return (
    <div>
      <PageHeader
        title="Jejak Audit"
        subtitle="Rekod tambah-sahaja bagi setiap perubahan pentadbiran."
      />

      <AppCard className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Jenis Entiti"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Tindakan"
            placeholder="Contoh: station.update"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </AppCard>

      {auditQuery.isLoading ? <LoadingState /> : null}

      {auditQuery.isError ? (
        <ErrorState
          message={
            auditQuery.error instanceof Error
              ? auditQuery.error.message
              : 'Gagal mendapatkan jejak audit.'
          }
          onRetry={() => void auditQuery.refetch()}
        />
      ) : null}

      {auditQuery.data && auditQuery.data.data.length === 0 ? (
        <EmptyState message="Tiada rekod audit sepadan dengan penapis ini." />
      ) : null}

      {auditQuery.data && auditQuery.data.data.length > 0 ? (
        <>
          <AppCard className="overflow-x-auto p-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Masa</th>
                  <th>Tindakan</th>
                  <th>Entiti</th>
                  <th>ID Entiti</th>
                  <th>Pelaku</th>
                  <th>Butiran</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.data.data.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </AppCard>

          <Pagination
            page={auditQuery.data.page}
            pageSize={auditQuery.data.pageSize}
            total={auditQuery.data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
