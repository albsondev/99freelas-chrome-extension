import type { ExtensionSettings, ProjectComplexity, ProjectData } from '../shared/types';
import { clamp, roundDown } from '../shared/utils';

export interface PriceResult {
  proposedPrice: number;
  averagePrice: number | null;
  discountPercentage: number | null;
  warnings: string[];
  requiresReview: boolean;
}

function complexityDiscount(complexity: ProjectComplexity, settings: ExtensionSettings): number {
  switch (complexity) {
    case 'low':
      return clamp(settings.maxPriceDiscountPercent, settings.minPriceDiscountPercent, 50);
    case 'medium':
      return settings.minPriceDiscountPercent;
    case 'high':
      return settings.minPriceDiscountPercent;
    default:
      return settings.minPriceDiscountPercent;
  }
}

export function calculatePrice(
  project: ProjectData,
  settings: ExtensionSettings,
  complexity: ProjectComplexity = 'medium',
): PriceResult {
  const warnings: string[] = [];
  const discount = complexityDiscount(complexity, settings) / 100;
  const average = project.averageProposalPrice ?? null;

  if (average && average > 0) {
    let proposed = roundDown(average * (1 - discount));
    proposed = Math.max(proposed, settings.valorMinimoAceitavel);

    if (project.budgetMin && proposed < project.budgetMin) {
      proposed = Math.max(project.budgetMin, settings.valorMinimoAceitavel);
      warnings.push('Preço ajustado ao mínimo informado pelo cliente.');
    }

    const actualDiscount = ((average - proposed) / average) * 100;

    return {
      proposedPrice: proposed,
      averagePrice: average,
      discountPercentage: Number(actualDiscount.toFixed(2)),
      warnings,
      requiresReview: actualDiscount < settings.minPriceDiscountPercent,
    };
  }

  if (project.budgetMax && project.budgetMin) {
    const midpoint = (project.budgetMin + project.budgetMax) / 2;
    let proposed = roundDown(midpoint * (1 - discount));
    proposed = Math.max(proposed, settings.valorMinimoAceitavel, project.budgetMin);
    return {
      proposedPrice: proposed,
      averagePrice: midpoint,
      discountPercentage: discount * 100,
      warnings: ['Valor médio não encontrado — usada faixa de orçamento do cliente.'],
      requiresReview: true,
    };
  }

  if (project.budgetMin) {
    const proposed = Math.max(project.budgetMin, settings.valorMinimoAceitavel);
    return {
      proposedPrice: proposed,
      averagePrice: null,
      discountPercentage: null,
      warnings: ['Dados insuficientes para calcular desconto sobre a média.'],
      requiresReview: true,
    };
  }

  return {
    proposedPrice: settings.valorMinimoAceitavel,
    averagePrice: null,
    discountPercentage: null,
    warnings: ['Sem média ou orçamento — usando valor mínimo configurado.'],
    requiresReview: true,
  };
}
