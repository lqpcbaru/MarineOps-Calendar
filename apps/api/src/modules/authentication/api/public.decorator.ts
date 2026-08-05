import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route or controller as public (no access token required).
 * Per NFR-SEC-001 only health and auth endpoints are public.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
