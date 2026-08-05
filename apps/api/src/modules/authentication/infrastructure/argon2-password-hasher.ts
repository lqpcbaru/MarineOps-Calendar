import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PasswordHasher } from '../application/ports/password-hasher.port';

/**
 * argon2id password hasher (ADR-0010 §3).
 *
 * Parameters are OWASP-recommended defaults. The encoded string includes the
 * salt and parameters, so verification is self-describing.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  private readonly options: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, this.options);
  }

  async verify(plaintext: string, encoded: string): Promise<boolean> {
    try {
      return await argon2.verify(encoded, plaintext);
    } catch {
      // Malformed hash or unsupported variant — treat as failed verification.
      return false;
    }
  }
}
