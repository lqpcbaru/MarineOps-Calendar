import type { DailyOperationalRecord } from '../../operational-calendar/domain';
import type { RuleResult } from '../domain';

export class TideRule {
  readonly ruleId = 'tide-rule';
  readonly ruleName = 'Penilaian Pasang Surut';

  evaluate(record: DailyOperationalRecord): RuleResult {
    const t = record.tide;
    if (!t) return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Data pasang surut tidak tersedia', recommendation: 'Tidak dapat menilai keadaan pasang surut.' };

    return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 15, message: 'Data pasang surut tersedia', recommendation: 'Rujuk jadual pasang surut untuk perancangan.' };
  }
}
