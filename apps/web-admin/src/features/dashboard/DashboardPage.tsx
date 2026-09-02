import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../../shared/auth/auth-context';
import { PERMISSIONS } from '../../shared/auth/permissions';
import {
  AppCard,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '../../shared/components';
import { listUsers } from '../users/users.api';
import { listRoles } from '../roles/roles.api';
import { listStations } from '../stations/stations.api';
import { listAudit } from '../audit/audit.api';

interface SummaryCardProps {
  label: string;
  value: string | number;
  to: string;
  hint?: string;
}

function SummaryCard({ label, value, to, hint }: SummaryCardProps) {
  return (
    <Link to={to} className="block focus-visible:outline-2 focus-visible:outline-ocean-400">
      <AppCard className="h-full transition-colors hover:border-ocean-400">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
        {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
      </AppCard>
    </Link>
  );
}

/**
 * Operational summary built only from endpoints the principal is allowed to
 * call. Each query is gated on its own permission so a FisheriesOfficer
 * (who lacks user.manage) does not fire a request that would 403 and render
 * a spurious error.
 */
export function DashboardPage() {
  const { principal, can } = useAuth();

  const usersQuery = useQuery({
    queryKey: ['admin-users', 1, 1],
    queryFn: () => listUsers({ page: 1, pageSize: 1 }),
    enabled: can(PERMISSIONS.users),
  });

  const rolesQuery = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => listRoles(),
    enabled: can(PERMISSIONS.roles),
  });

  const stationsQuery = useQuery({
    queryKey: ['admin-stations', 'summary'],
    queryFn: () => listStations({ page: 1, pageSize: 1, status: 'ACTIVE' }),
    enabled: can(PERMISSIONS.stationRead),
  });

  const auditQuery = useQuery({
    queryKey: ['admin-audit', 'recent'],
    queryFn: () => listAudit({ page: 1, pageSize: 5 }),
    enabled: can(PERMISSIONS.audit),
  });

  const anyLoading =
    usersQuery.isLoading || rolesQuery.isLoading || stationsQuery.isLoading || auditQuery.isLoading;

  return (
    <div>
      <PageHeader
        title="Papan Pemuka"
        subtitle={principal ? `Selamat kembali, ${principal.name}.` : undefined}
      />

      {anyLoading ? <LoadingState lines={3} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {can(PERMISSIONS.users) && usersQuery.data ? (
          <SummaryCard label="Pengguna" value={usersQuery.data.total} to="/users" />
        ) : null}
        {can(PERMISSIONS.roles) && rolesQuery.data ? (
          <SummaryCard label="Peranan" value={rolesQuery.data.length} to="/roles" />
        ) : null}
        {can(PERMISSIONS.stationRead) && stationsQuery.data ? (
          <SummaryCard
            label="Stesen Aktif"
            value={stationsQuery.data.total}
            to="/stations"
            hint="Tidak termasuk stesen diarkib"
          />
        ) : null}
        {can(PERMISSIONS.audit) && auditQuery.data ? (
          <SummaryCard label="Rekod Audit" value={auditQuery.data.total} to="/audit" />
        ) : null}
      </div>

      {usersQuery.isError || rolesQuery.isError || stationsQuery.isError || auditQuery.isError ? (
        <div className="mt-4">
          <ErrorState message="Sebahagian ringkasan tidak dapat dimuatkan." />
        </div>
      ) : null}

      {can(PERMISSIONS.audit) ? (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-text-primary">Aktiviti Terkini</h2>
          {auditQuery.data && auditQuery.data.data.length > 0 ? (
            <AppCard className="overflow-x-auto p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tindakan</th>
                    <th>Entiti</th>
                    <th>Masa</th>
                  </tr>
                </thead>
                <tbody>
                  {auditQuery.data.data.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <StatusBadge tone="neutral">{entry.action}</StatusBadge>
                      </td>
                      <td className="text-text-secondary">{entry.entityType}</td>
                      <td className="text-text-secondary">
                        {new Date(entry.at).toLocaleString('ms-MY')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AppCard>
          ) : auditQuery.data ? (
            <AppCard className="text-sm text-text-secondary">
              Tiada aktiviti direkodkan lagi.
            </AppCard>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
