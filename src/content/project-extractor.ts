import type { ProjectData } from '../shared/types';
import { normalizeText, parseCurrency, parseDays } from '../shared/utils';

function queryText(selectors: string[]): string {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return normalizeText(element.textContent);
    }
  }
  return '';
}

function findByHeading(keywords: string[]): string {
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, strong, b, label, span, div')];
  for (const heading of headings) {
    const text = normalizeText(heading.textContent ?? '').toLowerCase();
    if (!keywords.some((keyword) => text === keyword || text.startsWith(keyword))) continue;

    const sibling = heading.nextElementSibling;
    if (sibling?.textContent?.trim()) {
      return normalizeText(sibling.textContent);
    }

    const parent = heading.parentElement;
    if (parent) {
      const clone = parent.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('h1,h2,h3,h4,strong,b,label').forEach((node) => node.remove());
      const content = normalizeText(clone.textContent ?? '');
      if (content.length > 20) return content;
    }
  }
  return '';
}

function extractTitle(): string {
  const fromSelectors = queryText([
    '[data-project-title]',
    '.project-title',
    '.titulo-projeto',
    'h1',
  ]);

  if (fromSelectors && fromSelectors.length > 5) return fromSelectors;

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) return normalizeText(ogTitle);

  return normalizeText(document.title.replace(/\|\s*99Freelas.*/i, ''));
}

function extractDescription(): string {
  const fromHeading = findByHeading(['descrição', 'descricao', 'detalhes do projeto', 'sobre o projeto']);
  if (fromHeading) return fromHeading;

  const fromSelectors = queryText([
    '[data-project-description]',
    '.project-description',
    '.descricao-projeto',
    '.description',
    'article',
  ]);

  if (fromSelectors.length > 40) return fromSelectors;

  const paragraphs = [...document.querySelectorAll('p')]
    .map((p) => normalizeText(p.textContent ?? ''))
    .filter((text) => text.length > 80);

  return paragraphs.slice(0, 4).join('\n\n');
}

function extractAverageFromText(text: string): { price?: number; deadline?: number; count?: number } {
  const result: { price?: number; deadline?: number; count?: number } = {};

  const pricePatterns = [
    /m[eé]dia[^\n\r\d]*R\$\s*([\d.,]+)/i,
    /valor\s+m[eé]dio[^\n\r\d]*R\$\s*([\d.,]+)/i,
    /pre[cç]o\s+m[eé]dio[^\n\r\d]*R\$\s*([\d.,]+)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.price = parseCurrency(match[1]);
      break;
    }
  }

  const deadlinePatterns = [
    /m[eé]dia[^\n\r\d]*(\d+)\s*dias?/i,
    /prazo\s+m[eé]dio[^\n\r\d]*(\d+)\s*dias?/i,
    /duração\s+m[eé]dia[^\n\r\d]*(\d+)\s*dias?/i,
  ];

  for (const pattern of deadlinePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.deadline = parseDays(match[1]);
      break;
    }
  }

  const countMatch = text.match(/(\d+)\s+propostas?/i);
  if (countMatch) {
    result.count = Number.parseInt(countMatch[1], 10);
  }

  return result;
}

function extractBudget(text: string): { min?: number; max?: number } {
  const rangeMatch = text.match(/R\$\s*([\d.,]+)\s*[^\d]+R\$\s*([\d.,]+)/i);
  if (rangeMatch) {
    return {
      min: parseCurrency(rangeMatch[1]),
      max: parseCurrency(rangeMatch[2]),
    };
  }

  const minMatch = text.match(/m[ií]nimo[^\d]*R\$\s*([\d.,]+)/i);
  return { min: minMatch ? parseCurrency(minMatch[1]) : undefined };
}

function extractSkills(): string[] {
  const skillSection = findByHeading(['habilidades', 'skills', 'tecnologias']);
  if (!skillSection) return [];

  return skillSection
    .split(/[,;|•]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractProjectData(): ProjectData {
  const bodyText = document.body.innerText;
  const averages = extractAverageFromText(bodyText);
  const budget = extractBudget(bodyText);

  return {
    url: window.location.href,
    title: extractTitle(),
    description: extractDescription(),
    technologies: extractSkills(),
    skills: extractSkills(),
    budgetMin: budget.min,
    budgetMax: budget.max,
    averageProposalPrice: averages.price,
    averageProposalDeadlineDays: averages.deadline,
    proposalCount: averages.count,
    additionalQuestions: [],
    rawText: normalizeText(bodyText.slice(0, 12000)),
  };
}
