export class ProviderLogger {
  constructor(private readonly providerName: string) {}

  requestStart(endpoint: string, query?: Record<string, string>) {
    this.log('debug', `Permintaan dimulakan: ${endpoint}`, { query });
  }

  requestSuccess(endpoint: string, durationMs: number, responseSize?: number) {
    this.log('debug', `Permintaan berjaya: ${endpoint}`, { durationMs, responseSize });
  }

  requestRetry(endpoint: string, attempt: number, error: string) {
    this.log('warn', `Cuba semula (${attempt}): ${endpoint}`, { error });
  }

  requestFailed(endpoint: string, error: string, attempts: number) {
    this.log('error', `Permintaan gagal selepas ${attempts} cubaan: ${endpoint}`, { error });
  }

  private log(level: string, message: string, data?: Record<string, unknown>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      provider: this.providerName,
      message,
      ...data,
    };
    const output = JSON.stringify(entry);
    process.stdout.write(output + '\n');
  }
}
