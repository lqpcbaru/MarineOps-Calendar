/** Password hashing port (ADR-0010 §3 — argon2id). */
export interface PasswordHasher {
  /** Hash a plaintext password. Returns the argon2id encoded string. */
  hash(plaintext: string): Promise<string>;

  /** Verify a plaintext password against an argon2id encoded hash. */
  verify(plaintext: string, encoded: string): Promise<boolean>;
}
