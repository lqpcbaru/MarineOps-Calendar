import type { DailyOperationalRecord } from '../../operational-calendar/domain';
import type { RuleResult } from '../domain';

export class MoonRule {
  readonly ruleId = 'moon-rule';
  readonly ruleName = 'Penilaian Fasa Bulan';

  evaluate(record: DailyOperationalRecord): RuleResult {
    const m = record.moon;
    if (!m) return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Data fasa bulan tidak tersedia', recommendation: 'Tidak dapat menilai fasa bulan.' };

    const illum = m.illumination;
    if (illum >= 70) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 10, message: `Fasa bulan: ${m.phaseName}`, recommendation: 'Cahaya bulan baik untuk operasi malam.' };
    }
    if (illum >= 30) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'CAUTION', scoreContribution: 5, message: `Fasa bulan: ${m.phaseName}`, recommendation: 'Cahaya bulan sederhana. Sediakan lampu tambahan.' };
    }
    return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'CAUTION', scoreContribution: 5, message: `Fasa bulan: ${m.phaseName}`, recommendation: 'Cahaya bulan rendah. Operasi malam memerlukan lampu.' };
  }
}
