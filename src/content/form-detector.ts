import type { DetectedForm, FormFieldLimits } from '../shared/types';
import { normalizeText, parseCurrency, parseDays } from '../shared/utils';

const FORM_KEYWORDS = ['proposta', 'sua oferta', 'duração estimada', 'detalhes'];

function elementMatchesKeywords(element: Element, keywords: string[]): boolean {
  const text = normalizeText(
    `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('placeholder') ?? ''} ${element.textContent ?? ''}`,
  ).toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}

function findInputByLabelKeywords(keywords: string[]): HTMLInputElement | HTMLTextAreaElement | undefined {
  const labels = [...document.querySelectorAll('label')];

  for (const label of labels) {
    const labelText = normalizeText(label.textContent ?? '').toLowerCase();
    if (!keywords.some((keyword) => labelText.includes(keyword))) continue;

    const htmlFor = label.getAttribute('for');
    if (htmlFor) {
      const linked = document.getElementById(htmlFor);
      if (linked instanceof HTMLInputElement || linked instanceof HTMLTextAreaElement) {
        return linked;
      }
    }

    const nested = label.querySelector('input, textarea');
    if (nested instanceof HTMLInputElement || nested instanceof HTMLTextAreaElement) {
      return nested;
    }
  }

  const candidates = [...document.querySelectorAll('input, textarea')].filter((element) =>
    elementMatchesKeywords(element, keywords),
  );

  const first = candidates[0];
  if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement) {
    return first;
  }

  return undefined;
}

function findInputByNamePatterns(patterns: RegExp[]): HTMLInputElement | HTMLTextAreaElement | undefined {
  const fields = [...document.querySelectorAll('input, textarea')];
  for (const field of fields) {
    const name = `${field.getAttribute('name') ?? ''} ${field.getAttribute('id') ?? ''}`;
    if (patterns.some((pattern) => pattern.test(name))) {
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        return field;
      }
    }
  }
  return undefined;
}

function extractLimits(): FormFieldLimits {
  const limits: FormFieldLimits = {};
  const bodyText = document.body.innerText;

  const minPriceMatch = bodyText.match(/valor\s+m[ií]nimo[^\d]*R\$\s*([\d.,]+)/i);
  if (minPriceMatch) limits.priceMin = parseCurrency(minPriceMatch[1]);

  const maxDescMatch = bodyText.match(/m[aá]ximo[^\d]*(\d+)\s*caracter/i);
  if (maxDescMatch) limits.descriptionMaxLength = Number.parseInt(maxDescMatch[1], 10);

  return limits;
}

export function isProposalFormVisible(): boolean {
  const hasPrice = Boolean(
    findInputByLabelKeywords(['sua oferta', 'oferta']) ??
      findInputByNamePatterns([/valor|price|oferta/i]),
  );
  const hasDescription = Boolean(
    findInputByLabelKeywords(['detalhes', 'detalhe']) ??
      findInputByNamePatterns([/detalhe|descricao|description|mensagem/i]),
  );

  const keywordMatch = FORM_KEYWORDS.some((keyword) =>
    normalizeText(document.body.innerText).toLowerCase().includes(keyword),
  );

  return (hasPrice && hasDescription) || keywordMatch;
}

export function detectProposalForm(): DetectedForm | null {
  if (!isProposalFormVisible()) return null;

  const priceInput =
    (findInputByLabelKeywords(['sua oferta', 'oferta', 'valor']) as HTMLInputElement | undefined) ??
    (findInputByNamePatterns([/valor|price|oferta|amount/i]) as HTMLInputElement | undefined);

  const deadlineInput =
    (findInputByLabelKeywords(['duração', 'duracao', 'prazo']) as HTMLInputElement | undefined) ??
    (findInputByNamePatterns([/prazo|deadline|duracao|duration/i]) as HTMLInputElement | undefined);

  const descriptionInput =
    (findInputByLabelKeywords(['detalhes', 'detalhe', 'descrição']) as
      | HTMLTextAreaElement
      | HTMLInputElement
      | undefined) ??
    (findInputByNamePatterns([/detalhe|descricao|description|mensagem|proposal/i]) as
      | HTMLTextAreaElement
      | HTMLInputElement
      | undefined);

  const additionalFields: DetectedForm['additionalFields'] = [];
  const labels = [...document.querySelectorAll('label')];

  for (const label of labels) {
    const labelText = normalizeText(label.textContent ?? '');
    if (!labelText || /oferta|duração|duracao|detalhe/i.test(labelText)) continue;

    const htmlFor = label.getAttribute('for');
    const field = htmlFor
      ? document.getElementById(htmlFor)
      : label.querySelector('input, textarea');

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      additionalFields.push({ label: labelText, element: field });
    }
  }

  return {
    priceInput,
    deadlineInput,
    descriptionInput,
    additionalFields,
    limits: extractLimits(),
  };
}

export function watchForProposalForm(callback: (form: DetectedForm) => void, timeoutMs: number): () => void {
  let stopped = false;

  const tryDetect = () => {
    if (stopped) return;
    const form = detectProposalForm();
    if (form?.priceInput && form.descriptionInput) {
      callback(form);
    }
  };

  tryDetect();

  const observer = new MutationObserver(() => tryDetect());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const timer = window.setTimeout(() => {
    stopped = true;
    observer.disconnect();
  }, timeoutMs);

  return () => {
    stopped = true;
    observer.disconnect();
    window.clearTimeout(timer);
  };
}

export function parseDeadlineFieldValue(value: string): number | undefined {
  return parseDays(value);
}
