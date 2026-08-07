import type { DailyOperationalRecord } from '../../operational-calendar/domain';
import type { RuleResult } from '../domain';

export class WindRule {
  readonly ruleId = 'wind-rule';
  readonly ruleName = 'Penilaian Angin';

  private thresholds = { safeKnots: 15, cautionKnots: 22, unsafeKnots: 30 };

  evaluate(record: DailyOperationalRecord): RuleResult {
    const ww = record.windWave;
    if (!ww) return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Data angin tidak tersedia', recommendation: 'Tidak dapat menilai keadaan angin.' };

    const speed = ww.windSpeed;
    if (speed <= this.thresholds.safeKnots) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 20, message: 'Angin sesuai untuk operasi', recommendation: 'Keadaan angin tenang.' };
    }
    if (speed <= this.thresholds.cautionKnots) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'CAUTION', scoreContribution: 10, message: 'Angin sederhana', recommendation: 'Berwaspada dengan angin kencang.' };
    }
    if (speed <= this.thresholds.unsafeKnots) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'WARNING', scoreContribution: 0, message: 'Angin kencang', recommendation: 'Pertimbangkan untuk menangguh operasi.' };
    }
    return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Angin sangat kencang', recommendation: 'Operasi laut tidak disyorkan.' };
  }
}
