export type OverallStatus = 'SAFE' | 'CAUTION' | 'WARNING' | 'UNSAFE' | 'UNKNOWN';
export type Severity = 'SAFE' | 'CAUTION' | 'WARNING' | 'UNSAFE';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  status: Severity;
  scoreContribution: number;
  message: string;
  recommendation: string;
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

export async function getRecommendation(
  stationId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<RecommendationResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await fetch(
    `/api/public/recommendation${params.size ? '?' + params.toString() : ''}`,
  );
  if (!res.ok) throw new Error(`Gagal mendapatkan maklumat amaran marin (${res.status})`);
  return res.json();
}
