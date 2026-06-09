import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import type { ExtensionSettings } from './types';

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.sync.get(STORAGE_KEYS.settings);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored[STORAGE_KEYS.settings] as Partial<ExtensionSettings> | undefined),
    freelancerProfile: {
      ...DEFAULT_SETTINGS.freelancerProfile,
      ...(stored[STORAGE_KEYS.settings] as Partial<ExtensionSettings> | undefined)?.freelancerProfile,
    },
  };
}

export async function saveSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const next = {
    ...current,
    ...partial,
    freelancerProfile: {
      ...current.freelancerProfile,
      ...partial.freelancerProfile,
    },
  };
  await chrome.storage.sync.set({ [STORAGE_KEYS.settings]: next });
  return next;
}

export function normalizeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCurrency(value: string): number | undefined {
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseDays(value: string): number | undefined {
  const match = value.match(/(\d+)/);
  if (!match) return undefined;
  const days = Number.parseInt(match[1], 10);
  return Number.isFinite(days) ? days : undefined;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function roundDown(value: number): number {
  return Math.floor(value);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForCondition(
  predicate: () => boolean,
  timeoutMs: number,
  intervalMs = 250,
): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return true;
    await wait(intervalMs);
  }
  return predicate();
}
