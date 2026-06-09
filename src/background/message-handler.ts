import type { ExtensionSettings, MessageType, ProjectData, StatusUpdate } from '../shared/types';
import { generateProposalViaApi } from './api-client';

interface HandlerDeps {
  getSettings: () => Promise<ExtensionSettings>;
  saveSettings: (partial: Partial<ExtensionSettings>) => Promise<ExtensionSettings>;
  generateProposal: typeof generateProposalViaApi;
  getLastStatus: () => StatusUpdate;
  setLastStatus: (status: StatusUpdate) => void;
}

export async function handleMessage(
  message: MessageType,
  sendResponse: (response?: unknown) => void,
  deps: HandlerDeps,
): Promise<void> {
  try {
    switch (message.type) {
      case 'GET_STATUS':
        sendResponse(deps.getLastStatus());
        return;
      case 'GET_SETTINGS':
        sendResponse(await deps.getSettings());
        return;
      case 'SAVE_SETTINGS':
        sendResponse(await deps.saveSettings(message.settings));
        return;
      case 'GENERATE_PROPOSAL': {
        const data = await deps.generateProposal({
          project: (message as { project: ProjectData }).project,
          settings: (message as { settings: Parameters<typeof generateProposalViaApi>[0]['settings'] }).settings,
        });
        sendResponse({ ok: true, data });
        return;
      }
      case 'RUN_AGENT':
        sendResponse({ ok: true, delegated: true });
        return;
      case 'STATUS_UPDATE':
        deps.setLastStatus(message.payload);
        sendResponse({ ok: true });
        return;
      default:
        sendResponse({ ok: false, error: 'Mensagem desconhecida' });
    }
  } catch (error) {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
