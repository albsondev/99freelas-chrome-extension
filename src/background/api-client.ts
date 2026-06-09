import type { ExtensionSettings, ProjectData } from '../shared/types';
import { safeParseAgentResponse } from '../shared/schemas';
import { logger } from '../shared/logger';
import { getSettings } from '../shared/utils';

interface ApiPayload {
  project: ProjectData;
  settings: Pick<
    ExtensionSettings,
    | 'valorMinimoAceitavel'
    | 'minPriceDiscountPercent'
    | 'maxPriceDiscountPercent'
    | 'minDeadlineDays'
    | 'proposalMinChars'
    | 'proposalMaxChars'
    | 'useEmojis'
    | 'freelancerProfile'
  >;
}

export async function generateProposalViaApi(payload: ApiPayload) {
  const settings = await getSettings();
  const apiBaseUrl = settings.apiBaseUrl;

  if (!apiBaseUrl) {
    throw new Error('Configure a URL da API nas opções da extensão.');
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/generate-proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.apiToken ? { Authorization: `Bearer ${settings.apiToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha na API (${response.status}): ${text}`);
  }

  const json = await response.json();
  const parsed = safeParseAgentResponse(json);
  if (!parsed.success) {
    logger.warn('Resposta inválida da API, tentando campo data', parsed.error);
    const nested = safeParseAgentResponse((json as { data?: unknown }).data);
    if (!nested.success) {
      throw new Error('Resposta da IA inválida.');
    }
    return nested.data;
  }

  return parsed.data;
}

export const generateProposal = generateProposalViaApi;
