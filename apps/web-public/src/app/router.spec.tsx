import '@testing-library/jest-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { router } from './router';

/**
 * Router-level integration test — the only place this repo verifies
 * TanStack Router's actual route table, including the notFoundComponent
 * wired onto the root route (apps/web-public previously had zero
 * component/router tests despite jsdom + Testing Library already being
 * configured).
 */
describe('router', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    // HomePage (the "/" route) fetches the dashboard on mount; keep it from
    // making a real network call and from ever resolving mid-test.
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the branded NotFoundPage for an unmatched path', async () => {
    const history = createMemoryHistory({ initialEntries: ['/this-route-does-not-exist'] });
    router.update({ history });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Halaman Tidak Dijumpai')).toBeInTheDocument();
    });
    expect(screen.getByText('Kembali ke Laman Utama')).toBeInTheDocument();
  });

  it('resolves a known route without falling through to the 404', async () => {
    const history = createMemoryHistory({ initialEntries: ['/mengenai'] });
    router.update({ history });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.queryByText('Halaman Tidak Dijumpai')).not.toBeInTheDocument();
    });
  });
});
