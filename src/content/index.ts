import { bootstrapContentScript, runAgent } from './agent-orchestrator';

void bootstrapContentScript();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'RUN_AGENT') {
    void runAgent(Boolean(message.force)).then(sendResponse);
    return true;
  }
  return false;
});
