import type { ProjectComplexity, ProjectData, ProjectType } from '../shared/types';
import { ACCEPTED_TECH_PATTERNS, ECOM_FULL_PATTERNS } from '../shared/constants';

export function inferProjectType(text: string): ProjectType {
  if (/\b(bug|corre(ç|c)(ã|a)o|erro|fix)\b/i.test(text)) return 'bug_fix';
  if (/\b(manuten(ç|c)(ã|a)o|suporte)\b/i.test(text)) return 'maintenance';
  if (/\b(landing\s*page|lp\b)/i.test(text)) return 'landing_page';
  if (/\b(site\s+institucional|escritório|advogad)/i.test(text)) return 'institutional_site';
  if (/\b(dashboard|painel\s+admin)/i.test(text)) return 'dashboard';
  if (/\b(api|integra(ç|c)(ã|a)o)\b/i.test(text)) return 'api_integration';
  if (/\brefator/i.test(text)) return 'refactoring';
  return 'other';
}

export function inferComplexity(text: string): ProjectComplexity {
  if (ECOM_FULL_PATTERNS.some((p) => p.test(text))) return 'high';
  if (/\b(simples|rápid|pontual|pequen|ajuste)\b/i.test(text)) return 'low';
  if (/\b(completo|do zero|plataforma|módulos|microserv)/i.test(text)) return 'high';
  return 'medium';
}

export function classifyProject(project: ProjectData): {
  projectType: ProjectType;
  complexity: ProjectComplexity;
  hasAcceptedTech: boolean;
} {
  const text = `${project.title} ${project.description}`;
  return {
    projectType: inferProjectType(text),
    complexity: inferComplexity(text),
    hasAcceptedTech: ACCEPTED_TECH_PATTERNS.some((pattern) => pattern.test(text)),
  };
}
