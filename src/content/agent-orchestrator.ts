import { generateLocalProposal } from '../domain/local-proposal-generator';
import { validateProposalResponse } from '../domain/proposal-validator';
import { STATE_MESSAGES } from '../shared/constants';
import { logger } from '../shared/logger';
import type { AgentRunResult, AgentState, ExtensionSettings, StatusUpdate } from '../shared/types';
import { getSettings } from '../shared/utils';
import { detectProposalForm, watchForProposalForm } from './form-detector';
import { attachUserEditGuards, fillProposalForm } from './form-filler';
import { renderCompletion, renderStatus, ensureManualTrigger } from './notification-ui';
import { isExtensionContextValid, pageKind } from './page-detector';
import { extractProjectData } from './project-extractor';

let running = false;

async function updateStatus(state: AgentState, message: string, result?: AgentRunResult): Promise<void> {
  const payload: StatusUpdate = { state, message, result };
  renderStatus(message, state === 'ERROR' || state === 'REJECTED' ? 'error' : 'info');
  await chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', payload }).catch(() => undefined);
}

async function requestAiProposal(project: ReturnType<typeof extractProjectData>, settings: ExtensionSettings) {
  if (!settings.apiBaseUrl) {
    logger.info('API não configurada — usando gerador local.');
    return generateLocalProposal(project, settings);
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_PROPOSAL',
      project,
      settings: {
        valorMinimoAceitavel: settings.valorMinimoAceitavel,
        minPriceDiscountPercent: settings.minPriceDiscountPercent,
        maxPriceDiscountPercent: settings.maxPriceDiscountPercent,
        minDeadlineDays: settings.minDeadlineDays,
        proposalMinChars: settings.proposalMinChars,
        proposalMaxChars: settings.proposalMaxChars,
        useEmojis: settings.useEmojis,
        freelancerProfile: settings.freelancerProfile,
      },
    });

    if (response?.ok && response.data) {
      return response.data;
    }

    throw new Error(response?.error ?? 'Falha ao gerar proposta via API.');
  } catch (error) {
    logger.warn('Fallback para gerador local', error);
    return generateLocalProposal(project, settings);
  }
}

export async function runAgent(force = false): Promise<AgentRunResult> {
  if (running) {
    return {
      state: 'ERROR',
      message: 'Já existe uma análise em andamento.',
      filled: false,
    };
  }

  running = true;

  try {
    if (!isExtensionContextValid()) {
      const result: AgentRunResult = {
        state: 'ERROR',
        message: 'Extensão inativa nesta página ou sessão não detectada.',
        filled: false,
      };
      await updateStatus('ERROR', result.message, result);
      return result;
    }

    if (pageKind() !== 'project') {
      const result: AgentRunResult = {
        state: 'ERROR',
        message: 'Abra a página de um projeto do 99Freelas.',
        filled: false,
      };
      await updateStatus('ERROR', result.message, result);
      return result;
    }

    await updateStatus('EXTRACTING_PROJECT', STATE_MESSAGES.EXTRACTING_PROJECT);

    const settings = await getSettings();
    const project = extractProjectData();

    if (!project.title) {
      const result: AgentRunResult = {
        state: 'REVIEW_REQUIRED',
        message: 'Não foi possível ler o título do projeto.',
        project,
        filled: false,
      };
      await updateStatus('REVIEW_REQUIRED', result.message, result);
      return result;
    }

    await updateStatus('ANALYZING_ELIGIBILITY', STATE_MESSAGES.ANALYZING_ELIGIBILITY);

    let form = detectProposalForm();
    if (!form) {
      await updateStatus('WAITING_FOR_FORM', STATE_MESSAGES.WAITING_FOR_FORM);
      await new Promise<void>((resolve) => {
        watchForProposalForm(() => resolve(), settings.waitTimeoutMs);
      });
      form = detectProposalForm();
    }

    if (!form?.priceInput || !form.descriptionInput) {
      const result: AgentRunResult = {
        state: 'ERROR',
        message: 'Formulário de proposta não encontrado. Abra "Enviar proposta" e tente novamente.',
        project,
        filled: false,
      };
      await updateStatus('ERROR', result.message, result);
      return result;
    }

    attachUserEditGuards(form);

    await updateStatus('GENERATING_PROPOSAL', STATE_MESSAGES.GENERATING_PROPOSAL);
    const response = await requestAiProposal(project, settings);

    if (!response.eligible) {
      const result: AgentRunResult = {
        state: 'REJECTED',
        message: 'Projeto não recomendado para o seu perfil.',
        project,
        response,
        filled: false,
      };
      renderCompletion(result, response);
      await updateStatus('REJECTED', result.message, result);
      return result;
    }

    await updateStatus('VALIDATING_RESPONSE', STATE_MESSAGES.VALIDATING_RESPONSE);
    const validation = validateProposalResponse(response, project, settings);

    if (!validation.valid) {
      const result: AgentRunResult = {
        state: 'REVIEW_REQUIRED',
        message: `Revisão necessária: ${validation.errors.join(' ')}`,
        project,
        response,
        filled: false,
      };
      renderCompletion(result, response);
      await updateStatus('REVIEW_REQUIRED', result.message, result);
      return result;
    }

    await updateStatus('FILLING_FORM', STATE_MESSAGES.FILLING_FORM);
    fillProposalForm(form, response, force);

    const result: AgentRunResult = {
      state: 'COMPLETED',
      message: STATE_MESSAGES.COMPLETED,
      project,
      response,
      filled: true,
    };

    renderCompletion(result, response);
    await updateStatus('COMPLETED', result.message, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : STATE_MESSAGES.ERROR;
    const result: AgentRunResult = {
      state: 'ERROR',
      message,
      filled: false,
    };
    await updateStatus('ERROR', message, result);
    return result;
  } finally {
    running = false;
  }
}

export async function bootstrapContentScript(): Promise<void> {
  if (!isExtensionContextValid()) return;

  const settings = await getSettings();

  const trigger = () => {
    void runAgent(false);
  };

  if (settings.mode === 'manual') {
    ensureManualTrigger(trigger);
  }

  watchForProposalForm(async () => {
    if (settings.mode === 'automatic') {
      await runAgent(false);
    } else {
      ensureManualTrigger(trigger);
    }
  }, settings.waitTimeoutMs);
}
