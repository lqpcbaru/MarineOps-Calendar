/**
 * NestJS DI tokens for authentication port interfaces.
 *
 * Interfaces are types, not values, so they cannot be used as injection keys
 * directly. These string tokens are imported by both the api layer (providers)
 * and the application layer (use-case @Inject decorators), keeping a single
 * source of truth with no circular dependency.
 */
export const CLOCK = 'CLOCK';
export const PASSWORD_HASHER = 'PASSWORD_HASHER';
export const TOKEN_SERVICE = 'TOKEN_SERVICE';
export const USER_IDENTITY_PROVIDER = 'USER_IDENTITY_PROVIDER';
export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';
export const DOMAIN_EVENT_BUS = 'DOMAIN_EVENT_BUS';
export const JWT_ACCESS_SECRET = 'JWT_ACCESS_SECRET';
export const JWT_REFRESH_TTL_DAYS = 'JWT_REFRESH_TTL_DAYS';
export const JWT_ACCESS_TTL_MINUTES = 'JWT_ACCESS_TTL_MINUTES';
