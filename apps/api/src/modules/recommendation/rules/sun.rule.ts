import type { DailyOperationalRecord } from '../../operational-calendar/domain';
import type { RuleResult } from '../domain';

export class SunRule {
  readonly ruleId = 'sun-rule';
  readonly ruleName = 'Penilaian Waktu Siang';

  evaluate(record: DailyOperationalRecord): RuleResult {
    const s = record.sun;
    if (!s) return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Data matahari tidak tersedia', recommendation: 'Tidak dapat menilai waktu siang.' };

    const len = s.dayLength;
    if (len.includes('12H') || len.includes('13H')) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 15, message: 'Waktu siang mencukupi', recommendation: 'Tempoh siang yang panjang sesuai untuk operasi.' };
    }
    return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 10, message: 'Data waktu siang tersedia', recommendation: 'Rancang operasi mengikut waktu siang.' };
  }
}
