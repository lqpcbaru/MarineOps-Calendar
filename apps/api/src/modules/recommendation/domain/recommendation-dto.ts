import type { DailyOperationalRecord } from '../../operational-calendar/domain';

export type Severity = 'SAFE' | 'CAUTION' | 'WARNING' | 'UNSAFE';
export type OverallStatus = 'SAFE' | 'CAUTION' | 'WARNING' | 'UNSAFE' | 'UNKNOWN';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  status: Severity;
  scoreContribution: number;
  message: string;
  recommendation: string;
}

export interface RecommendationRule {
  ruleId: string;
  ruleName: string;
  evaluate(record: DailyOperationalRecord): RuleResult;
}

export interface OperationalRecommendation {
  stationId: string;
  stationName: string;
  date: string;
  overallStatus: OverallStatus;
  overallScore: number;
  recommendation: string;
  warnings: string[];
  advisories: string[];
  ruleResults: RuleResult[];
  generatedAt: string;
}

export interface RecommendationResponse {
  data: OperationalRecommendation[];
  generatedAt: string;
}
