import '@testing-library/jest-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { router } from './router';
import { RouteErrorPage } from '../shared/components/RouteErrorPage';

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

describe('RouteErrorPage wiring', () => {
  it('catches a component that throws during render instead of unmounting the tree', async () => {
    // A minimal isolated router — the real app's pages don't currently
    // throw, so this verifies the errorComponent wiring pattern itself:
    // an uncaught render error is caught and RouteErrorPage renders,
    // rather than React unmounting to a blank page.
    function Boom(): never {
      throw new Error('boom from a broken page');
    }

    const testRootRoute = createRootRoute({ errorComponent: RouteErrorPage });
    const testIndexRoute = createRoute({
      getParentRoute: () => testRootRoute,
      path: '/',
      component: Boom,
    });
    const testRouter = createRouter({
      routeTree: testRootRoute.addChildren([testIndexRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });

    render(<RouterProvider router={testRouter} />);

    await waitFor(() => {
      expect(screen.getByText('Sesuatu Telah Tidak Kena')).toBeInTheDocument();
    });
    expect(screen.getByText('boom from a broken page')).toBeInTheDocument();
  });
});
