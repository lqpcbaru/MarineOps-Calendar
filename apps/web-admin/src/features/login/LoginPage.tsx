import { useEffect, useState } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useAuth } from '../../shared/auth/auth-context';
import { AppButton, AppCard, LoadingState, TextField } from '../../shared/components';

export function LoginPage() {
  const { status, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Clear the typed password as soon as a session exists so it does not sit
  // in component state behind the redirect.
  useEffect(() => {
    if (status === 'authenticated') setPassword('');
  }, [status]);

  if (status === 'restoring') {
    return (
      <div className="mx-auto max-w-sm py-20">
        <LoadingState lines={3} />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // On success the `authenticated` branch above redirects.
    } catch (err) {
      // The API returns a deliberately non-specific message for bad
      // credentials (it does not reveal whether the email exists); show it
      // as-is rather than inventing a more precise one.
      setError(err instanceof Error ? err.message : 'Log masuk gagal. Sila cuba lagi.');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">
          MarineOps <span className="text-text-accent">Pentadbir</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Log masuk untuk meneruskan.</p>
      </div>

      <AppCard>
        <form onSubmit={onSubmit} noValidate>
          <TextField
            label="E-mel"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <TextField
            className="mt-4"
            label="Kata Laluan"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          {error ? (
            <p role="alert" className="mt-4 text-sm text-danger-400">
              {error}
            </p>
          ) : null}

          <AppButton type="submit" className="mt-5 w-full" disabled={submitting}>
            {submitting ? 'Sedang log masuk...' : 'Log Masuk'}
          </AppButton>
        </form>
      </AppCard>
    </div>
  );
}
