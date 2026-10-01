import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { createNdjsonParser, stripLeadingFence } from '../utils/streamEvents';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const update = (patch: Partial<GeneratedComponent>) =>
      setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

    try {
      const res = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate component');
      }

      // 응답이 시작되면 빈 카드를 먼저 만들고, 토큰이 도착할 때마다 코드를 채운다.
      setComponents((prev) => [
        { id, prompt, code: '', createdAt: new Date(), isStreaming: true },
        ...prev,
      ]);

      const parse = createNdjsonParser();
      const decoder = new TextDecoder();
      let streamed = '';
      let finished = false;

      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        for (const event of parse(decoder.decode(chunk, { stream: true }))) {
          if (event.type === 'delta') {
            streamed += event.text;
            update({ code: stripLeadingFence(streamed) });
          } else if (event.type === 'done') {
            finished = true;
            update({ code: event.code, isStreaming: false });
          } else {
            throw new Error(event.message);
          }
        }
      }

      if (!finished) {
        throw new Error('응답이 중간에 끊겼습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      // 중간에 실패하면 미완성 카드를 제거한다.
      setComponents((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, isLoading, error, generate, removeComponent, clearAll };
}
