import type { AgentProposalResponse, ExtensionSettings, ProjectData } from '../shared/types';
import { evaluateEligibility } from './eligibility-engine';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProposalResponse(
  response: AgentProposalResponse,
  project: ProjectData,
  settings: ExtensionSettings,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [...response.warnings];

  const eligibility = evaluateEligibility(project);

  if (!response.eligible) {
    errors.push('Projeto marcado como inelegível pela IA.');
  }

  if (response.classification === 'LOW_FIT' || response.classification === 'REJECTED') {
    errors.push('Classificação de compatibilidade insuficiente.');
  }

  if (response.proposalText) {
    const length = response.proposalText.length;
    if (length < settings.proposalMinChars) {
      warnings.push(`Proposta abaixo do tamanho preferido (${length} caracteres).`);
    }
    if (length > settings.proposalMaxChars) {
      warnings.push(`Proposta acima do tamanho preferido (${length} caracteres).`);
    }
  } else if (response.eligible) {
    errors.push('Texto da proposta vazio.');
  }

  if (response.proposedPrice != null && response.proposedPrice < settings.valorMinimoAceitavel) {
    errors.push('Preço abaixo do valor mínimo configurado.');
  }

  if (
    response.averagePrice &&
    response.proposedPrice &&
    response.priceDiscountPercentage != null &&
    response.priceDiscountPercentage < settings.minPriceDiscountPercent
  ) {
    warnings.push('Desconto abaixo do percentual mínimo configurado.');
  }

  if (response.proposedDeadlineDays != null && response.proposedDeadlineDays < settings.minDeadlineDays) {
    errors.push('Prazo abaixo do mínimo permitido.');
  }

  if (eligibility.reasons.length > 0 && response.eligible) {
    errors.push('Tecnologias proibidas detectadas localmente.');
    errors.push(...eligibility.reasons);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
