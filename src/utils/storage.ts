import type { GeneratedComponent } from '../types';

export const STORAGE_KEYS = {
  apiKey: 'rcg:apiKey',
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export const MAX_PROMPT_HISTORY = 20;

// 저장소 접근은 사생활 보호 모드·용량 초과 등으로 실패할 수 있으므로 항상 조용히 폴백한다.
export function readStorage<T>(
  key: string,
  fallback: T,
  parse?: (raw: unknown) => T | undefined,
): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const raw: unknown = JSON.parse(stored);
    if (!parse) return raw as T;
    return parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시한다. 상태는 메모리에 그대로 유지된다.
  }
}

export function reviveComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.id !== 'string' ||
      typeof item.prompt !== 'string' ||
      typeof item.code !== 'string' ||
      typeof item.createdAt !== 'string'
    ) {
      return [];
    }
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) return [];
    return [{ id: item.id, prompt: item.prompt, code: item.code, createdAt }];
  });
}

export function addPromptHistory(
  history: string[],
  prompt: string,
  max = MAX_PROMPT_HISTORY,
): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, max);
}
