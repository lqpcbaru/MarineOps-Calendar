import type { DailyOperationalRecord } from '../../operational-calendar/domain';
import type { RuleResult } from '../domain';

export class WaveRule {
  readonly ruleId = 'wave-rule';
  readonly ruleName = 'Penilaian Ombak';

  private thresholds = { safeMeters: 1.5, cautionMeters: 2.5, unsafeMeters: 3.5 };

  evaluate(record: DailyOperationalRecord): RuleResult {
    const ww = record.windWave;
    if (!ww) return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Data ombak tidak tersedia', recommendation: 'Tidak dapat menilai keadaan ombak.' };

    const height = ww.waveHeight;
    if (height <= this.thresholds.safeMeters) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 20, message: 'Ombak sesuai untuk operasi', recommendation: 'Keadaan ombak tenang.' };
    }
    if (height <= this.thresholds.cautionMeters) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'CAUTION', scoreContribution: 10, message: 'Ombak sederhana', recommendation: 'Berwaspada dengan ketinggian ombak.' };
    }
    if (height <= this.thresholds.unsafeMeters) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'WARNING', scoreContribution: 0, message: 'Ombak tinggi', recommendation: 'Pertimbangkan untuk menangguh operasi.' };
    }
    return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Ombak sangat tinggi', recommendation: 'Operasi laut tidak disyorkan.' };
  }
}
