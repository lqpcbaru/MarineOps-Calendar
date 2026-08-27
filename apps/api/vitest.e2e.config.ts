import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

// NestJS's decorator-based DI relies on TypeScript's emitDecoratorMetadata
// (design:paramtypes), which esbuild — Vitest's default transform — does
// not implement. Without this, any class-typed constructor param with no
// explicit @Inject() (e.g. JwtAuthGuard's `reflector: Reflector`) fails to
// resolve when a real NestJS module graph is compiled in tests.
export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    root: '.',
    include: ['tests/e2e/**/*.e2e-spec.ts'],
    testTimeout: 30000,
  },
});
