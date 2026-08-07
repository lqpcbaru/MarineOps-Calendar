import { describe, expect, it } from 'vitest';
import { calculateOverallScore, calculateOverallStatus, generateRecommendation } from '../domain/scoring-engine';
import type { RuleResult } from '../domain';

function makeResult(status: RuleResult['status'], score: number): RuleResult {
  return { ruleId: 'r1', ruleName: 'Test', status, scoreContribution: score, message: 'msg', recommendation: 'rec' };
}

describe('ScoringEngine', () => {
  it('sums scores from all rules', () => {
    const results = [makeResult('SAFE', 20), makeResult('SAFE', 20), makeResult('CAUTION', 10)];
    expect(calculateOverallScore(results)).toBe(50);
  });

  it('returns UNKNOWN for empty results', () => {
    expect(calculateOverallStatus([], 0)).toBe('UNKNOWN');
  });

  it('returns UNSAFE if any rule is UNSAFE', () => {
    const results = [makeResult('SAFE', 20), makeResult('UNSAFE', 0)];
    expect(calculateOverallStatus(results, 20)).toBe('UNSAFE');
  });

  it('returns WARNING if any rule is WARNING and no UNSAFE', () => {
    const results = [makeResult('SAFE', 20), makeResult('WARNING', 0)];
    expect(calculateOverallStatus(results, 20)).toBe('WARNING');
  });

  it('returns SAFE when score >= 80 and no warnings', () => {
    const results = [makeResult('SAFE', 40), makeResult('SAFE', 40)];
    expect(calculateOverallStatus(results, 80)).toBe('SAFE');
  });

  it('returns CAUTION when score between 50-79', () => {
    const results = [makeResult('SAFE', 30), makeResult('CAUTION', 20)];
    expect(calculateOverallStatus(results, 50)).toBe('CAUTION');
  });

  it('generates appropriate recommendations', () => {
    expect(generateRecommendation('SAFE')).toContain('sesuai');
    expect(generateRecommendation('UNSAFE')).toContain('TIDAK disyorkan');
    expect(generateRecommendation('UNKNOWN')).toContain('tidak mencukupi');
  });
});
