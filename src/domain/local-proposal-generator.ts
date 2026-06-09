import { calculateDeadline } from '../domain/deadline-engine';
import { evaluateEligibility } from '../domain/eligibility-engine';
import { calculatePrice } from '../domain/pricing-engine';
import { classifyProject } from '../domain/project-classifier';
import type { AgentProposalResponse, ExtensionSettings, ProjectData } from '../shared/types';

function openingVariants(title: string): string {
  const snippets = [
    `Analisei o projeto "${title}" e entendi o escopo descrito.`,
    `Li com atenção sua solicitação sobre "${title}".`,
    `Revisei os detalhes de "${title}" e já tenho um plano inicial de execução.`,
  ];
  return snippets[Math.floor(Math.random() * snippets.length)];
}

function buildProposalText(
  project: ProjectData,
  settings: ExtensionSettings,
  summary: string,
  clientNeed: string,
): string {
  const profileNote = settings.freelancerProfile.platformProfileNote;
  const excerpt = project.description.slice(0, 220).trim();

  return [
    openingVariants(project.title),
    '',
    `Pelo que descreveu, a necessidade principal envolve ${clientNeed.toLowerCase()}. Em especial, observei trechos como: "${excerpt}${project.description.length > 220 ? '...' : ''}".`,
    '',
    'Pretendo conduzir o trabalho com uma abordagem objetiva: diagnóstico inicial, reprodução do cenário, implementação da correção/melhoria, testes e validação com você antes da entrega final.',
    '',
    `${profileNote} Tenho experiência prática com desenvolvimento web, APIs, manutenção e entrega de soluções com foco em clareza, performance e código sustentável.`,
    '',
    'Entregáveis previstos: solução implementada, validação funcional, orientações de uso/deploy quando necessário e suporte para conferência após a entrega.',
    '',
    'Fico à disposição para alinhar detalhes adicionais e iniciar assim que aprovar a proposta.',
    '',
    summary,
  ]
    .join('\n')
    .slice(0, settings.proposalMaxChars);
}

export function generateLocalProposal(
  project: ProjectData,
  settings: ExtensionSettings,
): AgentProposalResponse {
  const eligibility = evaluateEligibility(project);
  const { projectType, complexity } = classifyProject(project);
  const price = calculatePrice(project, settings, complexity);
  const deadline = calculateDeadline(project, complexity, settings.minDeadlineDays);

  if (!eligibility.eligible || eligibility.classification === 'REJECTED') {
    return {
      eligible: false,
      classification: eligibility.classification,
      confidence: 0.9,
      detectedTechnologies: eligibility.detectedTechnologies,
      projectType,
      complexity,
      summary: project.title,
      clientNeed: project.description.slice(0, 180) || 'Atender a demanda descrita pelo cliente.',
      proposedPrice: null,
      averagePrice: price.averagePrice,
      priceDiscountPercentage: null,
      proposedDeadlineDays: null,
      averageDeadlineDays: deadline.averageDeadlineDays,
      deadlineReductionPercentage: null,
      proposalText: null,
      additionalAnswers: [],
      warnings: eligibility.warnings,
      rejectionReasons: eligibility.reasons,
    };
  }

  const clientNeed =
    project.description.split(/[.!?]/).find((sentence) => sentence.trim().length > 20)?.trim() ??
    'Implementar a solução conforme o escopo apresentado.';

  const summary = `Resumo: ${project.title}`;

  const proposalText = buildProposalText(project, settings, summary, clientNeed);

  return {
    eligible: true,
    classification: eligibility.classification,
    confidence: 0.75,
    detectedTechnologies: eligibility.detectedTechnologies,
    projectType,
    complexity,
    summary,
    clientNeed,
    proposedPrice: price.proposedPrice,
    averagePrice: price.averagePrice,
    priceDiscountPercentage: price.discountPercentage,
    proposedDeadlineDays: deadline.proposedDeadlineDays,
    averageDeadlineDays: deadline.averageDeadlineDays,
    deadlineReductionPercentage: deadline.reductionPercentage,
    proposalText,
    additionalAnswers: [],
    warnings: [...eligibility.warnings, ...price.warnings, ...deadline.warnings],
    rejectionReasons: [],
  };
}
