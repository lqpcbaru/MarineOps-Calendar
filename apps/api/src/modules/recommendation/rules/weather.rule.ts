import type { DailyOperationalRecord } from '../../operational-calendar/domain';
import type { RuleResult } from '../domain';

export class WeatherRule {
  readonly ruleId = 'weather-rule';
  readonly ruleName = 'Penilaian Cuaca';

  private thresholds = {
    safeTempMin: 20, safeTempMax: 35,
    cautionTempMin: 18, cautionTempMax: 38,
  };

  evaluate(record: DailyOperationalRecord): RuleResult {
    const w = record.weather;
    if (!w) return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Data cuaca tidak tersedia', recommendation: 'Tidak dapat menilai keadaan cuaca.' };

    const temp = w.temperature;
    const cond = w.conditions;

    if (temp >= this.thresholds.safeTempMin && temp <= this.thresholds.safeTempMax && cond !== 'THUNDERSTORM') {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'SAFE', scoreContribution: 20, message: 'Cuaca sesuai untuk operasi', recommendation: 'Keadaan cuaca baik.' };
    }
    if (cond === 'THUNDERSTORM') {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'UNSAFE', scoreContribution: 0, message: 'Ribut petir dikesan', recommendation: 'Elakkan operasi laut semasa ribut petir.' };
    }
    if (temp < this.thresholds.cautionTempMin || temp > this.thresholds.cautionTempMax) {
      return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'CAUTION', scoreContribution: 10, message: 'Suhu di luar julat ideal', recommendation: 'Berwaspada dengan suhu melampau.' };
    }
    return { ruleId: this.ruleId, ruleName: this.ruleName, status: 'CAUTION', scoreContribution: 10, message: 'Keadaan cuaca sederhana', recommendation: 'Pantau perubahan cuaca.' };
  }
}
