import { useEffect, useState } from 'react';
import type { AgentRunResult, StatusUpdate } from '../shared/types';

export function App() {
  const [status, setStatus] = useState<StatusUpdate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: 'GET_STATUS' }).then(setStatus);
  }, []);

  const runOnActiveTab = async (force = false) => {
    setLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const result = (await chrome.tabs.sendMessage(tab.id, {
        type: 'RUN_AGENT',
        force,
      })) as AgentRunResult;
      setStatus({
        state: result.state,
        message: result.message,
        result,
      });
    } catch (error) {
      setStatus({
        state: 'ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível se comunicar com a página do 99Freelas.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup">
      <header>
        <h1>99Freelas IA</h1>
        <p>Assistente para análise e preenchimento de propostas.</p>
      </header>

      <section className="card">
        <div className="label">Status</div>
        <div className="value">{status?.message ?? 'Aguardando...'}</div>
        {status?.result?.response && (
          <div className="meta">
            <div>Compatibilidade: {status.result.response.classification}</div>
            {status.result.response.proposedPrice != null && (
              <div>Preço sugerido: R$ {status.result.response.proposedPrice}</div>
            )}
            {status.result.response.proposedDeadlineDays != null && (
              <div>Prazo sugerido: {status.result.response.proposedDeadlineDays} dias</div>
            )}
          </div>
        )}
      </section>

      <div className="actions">
        <button disabled={loading} onClick={() => void runOnActiveTab(false)}>
          Analisar e preencher
        </button>
        <button disabled={loading} className="secondary" onClick={() => void runOnActiveTab(true)}>
          Gerar novamente
        </button>
      </div>

      <footer>
        <a href="options.html" target="_blank" rel="noreferrer">
          Configurações
        </a>
      </footer>
    </div>
  );
}
