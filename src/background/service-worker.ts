import type { MessageType, StatusUpdate } from '../shared/types';
import { getSettings, saveSettings } from '../shared/utils';
import { generateProposal } from './api-client';
import { handleMessage } from './message-handler';

let lastStatus: StatusUpdate = {
  state: 'IDLE',
  message: 'Aguardando formulário de proposta...',
};

export function getLastStatus(): StatusUpdate {
  return lastStatus;
}

export function setLastStatus(status: StatusUpdate): void {
  lastStatus = status;
}

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  void handleMessage(message, sendResponse, {
    getSettings,
    saveSettings,
    generateProposal,
    getLastStatus,
    setLastStatus,
  });
  return true;
});

export { generateProposal };
