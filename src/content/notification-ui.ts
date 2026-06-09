import type { AgentProposalResponse, AgentRunResult } from '../shared/types';
import { formatCurrency } from '../shared/utils';

const PANEL_ID = 'freelas-ia-panel';

export function ensureManualTrigger(onClick: () => void): HTMLButtonElement {
  let button = document.getElementById('freelas-ia-trigger') as HTMLButtonElement | null;

  if (!button) {
    button = document.createElement('button');
    button.id = 'freelas-ia-trigger';
    button.type = 'button';
    button.textContent = 'Analisar e preencher proposta';
    button.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483646;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.35);
    `;
    document.body.appendChild(button);
  }

  button.onclick = onClick;
  return button;
}

export function hideManualTrigger(): void {
  document.getElementById('freelas-ia-trigger')?.remove();
}

export function renderStatus(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  let panel = document.getElementById(PANEL_ID) as HTMLDivElement | null;
  if (!panel) {
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      width: min(420px, calc(100vw - 32px));
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    `;
    document.body.appendChild(panel);
  }

  const colors = {
    info: { bg: '#eff6ff', border: '#2563eb', text: '#1e3a8a' },
    success: { bg: '#ecfdf5', border: '#059669', text: '#065f46' },
    error: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#d97706', text: '#92400e' },
  }[type];

  panel.innerHTML = `
    <div style="
      background:${colors.bg};
      border:1px solid ${colors.border};
      color:${colors.text};
      border-radius:12px;
      padding:16px;
      box-shadow:0 12px 30px rgba(0,0,0,.12);
    ">
      <div style="font-weight:700;margin-bottom:8px;">99Freelas IA</div>
      <div style="line-height:1.5;">${escapeHtml(message)}</div>
    </div>
  `;
}

export function renderCompletion(result: AgentRunResult, response: AgentProposalResponse): void {
  const lines = [
    result.message,
    '',
    `Compatibilidade: ${mapClassification(response.classification)}`,
  ];

  if (response.averagePrice != null && response.proposedPrice != null) {
    lines.push(`Preço médio: ${formatCurrency(response.averagePrice)}`);
    lines.push(`Preço sugerido: ${formatCurrency(response.proposedPrice)}`);
    if (response.priceDiscountPercentage != null) {
      lines.push(`Redução: ${response.priceDiscountPercentage.toFixed(0)}%`);
    }
  }

  if (response.averageDeadlineDays != null && response.proposedDeadlineDays != null) {
    lines.push(`Prazo médio: ${response.averageDeadlineDays} dias`);
    lines.push(`Prazo sugerido: ${response.proposedDeadlineDays} dias`);
  }

  if (response.rejectionReasons.length > 0) {
    lines.push('', 'Motivos:', ...response.rejectionReasons.map((reason) => `• ${reason}`));
  }

  if (response.warnings.length > 0) {
    lines.push('', 'Avisos:', ...response.warnings.map((warning) => `• ${warning}`));
  }

  renderStatus(lines.join('\n'), result.state === 'COMPLETED' ? 'success' : 'warning');
}

function mapClassification(value: string): string {
  switch (value) {
    case 'HIGH_FIT':
      return 'Alta';
    case 'MEDIUM_FIT':
      return 'Média';
    case 'LOW_FIT':
      return 'Baixa';
    default:
      return 'Recusado';
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}
