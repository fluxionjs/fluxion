import { ConsoleLogger } from '@nestjs/common';

export class Logger extends ConsoleLogger {
  protected formatPid(pid: number): string {
    return `[Fluxion] ${pid} - `;
  }
}
