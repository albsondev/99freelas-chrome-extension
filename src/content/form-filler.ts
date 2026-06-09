import type { AgentProposalResponse, DetectedForm } from '../shared/types';
import { setInputNumberValue, setNativeInputValue } from './native-input-setter';

const FILLED_ATTR = 'data-99freelas-ia-filled';

export interface FillResult {
  filledFields: string[];
  skippedFields: string[];
}

function isUserEdited(element: HTMLElement): boolean {
  return element.dataset.userEdited === 'true';
}

function markFilled(element: HTMLElement): void {
  element.setAttribute(FILLED_ATTR, 'true');
}

export function attachUserEditGuards(form: DetectedForm): void {
  const fields = [
    form.priceInput,
    form.deadlineInput,
    form.descriptionInput,
    ...form.additionalFields.map((item) => item.element),
  ].filter(Boolean) as HTMLElement[];

  for (const field of fields) {
    if (field.dataset.editGuardAttached === 'true') continue;
    field.dataset.editGuardAttached = 'true';
    field.addEventListener(
      'input',
      () => {
        if (field.getAttribute(FILLED_ATTR) === 'true') {
          field.dataset.userEdited = 'true';
        }
      },
      { passive: true },
    );
  }
}

export function fillProposalForm(
  form: DetectedForm,
  response: AgentProposalResponse,
  force = false,
): FillResult {
  const filledFields: string[] = [];
  const skippedFields: string[] = [];

  if (form.priceInput && response.proposedPrice != null) {
    if (!force && isUserEdited(form.priceInput)) {
      skippedFields.push('valor');
    } else {
      setInputNumberValue(form.priceInput, response.proposedPrice);
      markFilled(form.priceInput);
      filledFields.push('valor');
    }
  }

  if (form.deadlineInput && response.proposedDeadlineDays != null) {
    if (!force && isUserEdited(form.deadlineInput)) {
      skippedFields.push('prazo');
    } else {
      setInputNumberValue(form.deadlineInput, response.proposedDeadlineDays);
      markFilled(form.deadlineInput);
      filledFields.push('prazo');
    }
  }

  if (form.descriptionInput && response.proposalText) {
    if (!force && isUserEdited(form.descriptionInput)) {
      skippedFields.push('descrição');
    } else {
      setNativeInputValue(form.descriptionInput, response.proposalText);
      markFilled(form.descriptionInput);
      filledFields.push('descrição');
    }
  }

  for (const additional of response.additionalAnswers) {
    const field = form.additionalFields.find((item) =>
      item.label.toLowerCase().includes(additional.label.toLowerCase()),
    );

    if (!field) continue;

    if (!force && isUserEdited(field.element)) {
      skippedFields.push(additional.label);
      continue;
    }

    setNativeInputValue(field.element, additional.answer);
    markFilled(field.element);
    filledFields.push(additional.label);
  }

  return { filledFields, skippedFields };
}
