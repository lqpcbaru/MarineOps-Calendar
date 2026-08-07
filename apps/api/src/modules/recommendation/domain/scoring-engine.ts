import type { RuleResult, OverallStatus } from '../domain';

export function calculateOverallScore(results: RuleResult[]): number {
  return results.reduce((sum, r) => sum + r.scoreContribution, 0);
}

export function calculateOverallStatus(results: RuleResult[], score: number): OverallStatus {
  if (results.length === 0) return 'UNKNOWN';

  const hasUnsafe = results.some((r) => r.status === 'UNSAFE');
  if (hasUnsafe) return 'UNSAFE';

  const hasWarning = results.some((r) => r.status === 'WARNING');
  if (hasWarning) return 'WARNING';

  if (score >= 80) return 'SAFE';
  if (score >= 50) return 'CAUTION';
  return 'WARNING';
}

export function generateRecommendation(status: OverallStatus): string {
  switch (status) {
    case 'SAFE': return 'Keadaan sesuai untuk operasi laut. Semua parameter berada dalam julat selamat.';
    case 'CAUTION': return 'Keadaan sederhana. Operasi boleh dijalankan dengan berwaspada.';
    case 'WARNING': return 'Keadaan tidak menentu. Pertimbangkan untuk menangguh operasi.';
    case 'UNSAFE': return 'Keadaan tidak selamat. Operasi laut TIDAK disyorkan.';
    default: return 'Data tidak mencukupi untuk penilaian.';
  }
}
