import {
  ACCEPTED_TECH_PATTERNS,
  ECOM_FULL_PATTERNS,
  INJECTION_PATTERNS,
  REACT_NATIVE_COMPLEX_PATTERNS,
  REACT_NATIVE_SIMPLE_PATTERNS,
  REJECTED_TECH_PATTERNS,
} from '../shared/constants';
import type { ProjectClassification, ProjectData } from '../shared/types';
import { normalizeText } from '../shared/utils';

export interface EligibilityResult {
  classification: ProjectClassification;
  eligible: boolean;
  reasons: string[];
  warnings: string[];
  detectedTechnologies: string[];
}

function collectTechnologies(text: string): string[] {
  const found = new Set<string>();
  for (const { pattern, label } of REJECTED_TECH_PATTERNS) {
    if (pattern.test(text)) found.add(label);
  }
  for (const pattern of ACCEPTED_TECH_PATTERNS) {
    const match = text.match(pattern);
    if (match) found.add(match[0]);
  }
  if (/\breact\s*native\b/i.test(text)) found.add('React Native');
  return [...found];
}

function containsRejectedTech(text: string): string[] {
  const reasons: string[] = [];
  for (const { pattern, label } of REJECTED_TECH_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`${label} é uma tecnologia não aceita.`);
    }
  }
  return reasons;
}

function isJavaScriptOnly(text: string): boolean {
  return /\bjavascript\b/i.test(text) && !/\bjava\b(?![\w.-]*script)/i.test(text.replace(/javascript/gi, ''));
}

function analyzeReactNative(text: string): { eligible: boolean; reason?: string } {
  if (!/\breact\s*native\b/i.test(text)) {
    return { eligible: true };
  }

  const isSimple = REACT_NATIVE_SIMPLE_PATTERNS.some((pattern) => pattern.test(text));
  const isComplex = REACT_NATIVE_COMPLEX_PATTERNS.some((pattern) => pattern.test(text));

  if (isComplex && !isSimple) {
    return {
      eligible: false,
      reason: 'React Native com complexidade média/alta não é aceito.',
    };
  }

  if (isSimple && !isComplex) {
    return { eligible: true };
  }

  return {
    eligible: false,
    reason: 'Projeto React Native com escopo incerto — recusado por segurança.',
  };
}

function analyzeEcommerce(text: string): string[] {
  return ECOM_FULL_PATTERNS.filter((pattern) => pattern.test(text)).map(
    () => 'Projeto de e-commerce/marketplace completo não é aceito.',
  );
}

export function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function evaluateEligibility(project: ProjectData): EligibilityResult {
  const combined = normalizeText(`${project.title} ${project.description} ${project.rawText}`);
  const detectedTechnologies = collectTechnologies(combined);
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (detectPromptInjection(combined)) {
    warnings.push('Possível tentativa de manipulação detectada na descrição — será ignorada.');
  }

  reasons.push(...containsRejectedTech(combined));

  if (/\bjava\b/i.test(combined) && isJavaScriptOnly(combined)) {
    reasons.splice(
      reasons.findIndex((r) => r.includes('Java')),
      1,
    );
  }

  reasons.push(...analyzeEcommerce(combined));

  const reactNative = analyzeReactNative(combined);
  if (!reactNative.eligible && reactNative.reason) {
    reasons.push(reactNative.reason);
  }

  if (!project.title.trim()) {
    reasons.push('Título do projeto não encontrado.');
  }

  if (!project.description.trim()) {
    warnings.push('Descrição do projeto incompleta.');
  }

  const hasAcceptedSignal = ACCEPTED_TECH_PATTERNS.some((pattern) => pattern.test(combined));
  const hasRejectedOnly = reasons.length > 0;

  let classification: ProjectClassification = 'HIGH_FIT';

  if (hasRejectedOnly) {
    classification = 'REJECTED';
  } else if (!hasAcceptedSignal) {
    classification = 'MEDIUM_FIT';
    warnings.push('Tecnologias do perfil não identificadas claramente — revisão recomendada.');
  }

  const eligible = classification === 'HIGH_FIT' || classification === 'MEDIUM_FIT';

  return {
    classification,
    eligible,
    reasons,
    warnings,
    detectedTechnologies,
  };
}
