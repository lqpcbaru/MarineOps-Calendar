export class LoggingService {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  log(message: string, data?: Record<string, unknown>) {
    this.write('info', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>) {
    this.write('error', message, { ...data, error: error?.message, stack: error?.stack });
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.write('warn', message, data);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.write('debug', message, data);
  }

  private write(level: string, message: string, data?: Record<string, unknown>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...data,
    };
    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }
}
