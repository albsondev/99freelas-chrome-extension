import type { ProjectComplexity, ProjectData } from '../shared/types';
import { roundDown } from '../shared/utils';

export interface DeadlineResult {
  proposedDeadlineDays: number;
  averageDeadlineDays: number | null;
  reductionPercentage: number | null;
  warnings: string[];
  requiresReview: boolean;
}

function complexityFactor(complexity: ProjectComplexity): number {
  switch (complexity) {
    case 'low':
      return 0.5;
    case 'medium':
      return 0.65;
    case 'high':
      return 0.65;
    default:
      return 0.65;
  }
}

export function calculateDeadline(
  project: ProjectData,
  complexity: ProjectComplexity = 'medium',
  minDays = 1,
): DeadlineResult {
  const warnings: string[] = [];
  const average = project.averageProposalDeadlineDays ?? null;

  if (average && average > 0) {
    let proposed = roundDown(average * complexityFactor(complexity));
    proposed = Math.max(proposed, minDays);

    if (average <= minDays) {
      proposed = minDays;
      warnings.push('Prazo médio já está no mínimo permitido (1 dia).');
    }

    const reduction = average > 0 ? ((average - proposed) / average) * 100 : null;

    return {
      proposedDeadlineDays: proposed,
      averageDeadlineDays: average,
      reductionPercentage: reduction ? Number(reduction.toFixed(2)) : null,
      warnings,
      requiresReview: false,
    };
  }

  return {
    proposedDeadlineDays: Math.max(minDays, 3),
    averageDeadlineDays: null,
    reductionPercentage: null,
    warnings: ['Prazo médio não encontrado — usando estimativa padrão.'],
    requiresReview: true,
  };
}
