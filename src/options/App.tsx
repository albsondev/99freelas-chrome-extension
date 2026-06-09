import { useEffect, useState } from 'react';
import type { ExtensionSettings } from '../shared/types';

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }).then(setSettings);
  }, []);

  const update = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  };

  const save = async () => {
    if (!settings) return;
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings });
    setSaved(true);
  };

  if (!settings) {
    return <div className="page">Carregando...</div>;
  }

  return (
    <div className="page">
      <h1>Configurações — 99Freelas IA</h1>

      <section>
        <h2>Modo de operação</h2>
        <label>
          <select
            value={settings.mode}
            onChange={(event) => update('mode', event.target.value as ExtensionSettings['mode'])}
          >
            <option value="manual">Manual (botão na página)</option>
            <option value="automatic">Automático ao abrir formulário</option>
          </select>
        </label>
      </section>

      <section>
        <h2>Integração com IA</h2>
        <label>
          URL da API
          <input
            value={settings.apiBaseUrl}
            onChange={(event) => update('apiBaseUrl', event.target.value)}
            placeholder="https://seu-backend.com"
          />
        </label>
        <label>
          Token (opcional)
          <input
            type="password"
            value={settings.apiToken}
            onChange={(event) => update('apiToken', event.target.value)}
            placeholder="Bearer token"
          />
        </label>
      </section>

      <section>
        <h2>Regras comerciais</h2>
        <label>
          Valor mínimo aceitável (R$)
          <input
            type="number"
            value={settings.valorMinimoAceitavel}
            onChange={(event) => update('valorMinimoAceitavel', Number(event.target.value))}
          />
        </label>
        <label>
          Desconto mínimo sobre a média (%)
          <input
            type="number"
            value={settings.minPriceDiscountPercent}
            onChange={(event) => update('minPriceDiscountPercent', Number(event.target.value))}
          />
        </label>
        <label>
          Desconto máximo sobre a média (%)
          <input
            type="number"
            value={settings.maxPriceDiscountPercent}
            onChange={(event) => update('maxPriceDiscountPercent', Number(event.target.value))}
          />
        </label>
        <label>
          Prazo mínimo (dias)
          <input
            type="number"
            value={settings.minDeadlineDays}
            onChange={(event) => update('minDeadlineDays', Number(event.target.value))}
          />
        </label>
      </section>

      <section>
        <h2>Proposta</h2>
        <label>
          Tamanho mínimo (caracteres)
          <input
            type="number"
            value={settings.proposalMinChars}
            onChange={(event) => update('proposalMinChars', Number(event.target.value))}
          />
        </label>
        <label>
          Tamanho máximo (caracteres)
          <input
            type="number"
            value={settings.proposalMaxChars}
            onChange={(event) => update('proposalMaxChars', Number(event.target.value))}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.useEmojis}
            onChange={(event) => update('useEmojis', event.target.checked)}
          />
          Usar emojis
        </label>
      </section>

      <div className="actions">
        <button onClick={() => void save()}>Salvar configurações</button>
        {saved && <span className="saved">Salvo com sucesso.</span>}
      </div>
    </div>
  );
}
