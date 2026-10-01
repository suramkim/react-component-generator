// 프로바이더 스트리밍 응답(SSE)을 파싱하는 순수 함수들.

/** 청크를 받아 완성된 SSE `data:` 줄의 페이로드만 반환한다. 잘린 줄은 버퍼에 보관한다. */
export function createSSEParser(): (chunk: string) => string[] {
  let buffer = '';
  return (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    return lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());
  };
}

export function extractAnthropicText(data: string): string {
  const event = JSON.parse(data) as { type: string; delta?: { type: string; text?: string } };
  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return event.delta.text ?? '';
  }
  return '';
}

export function extractGeminiChunk(data: string): { text: string; truncated: boolean } {
  const event = JSON.parse(data) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  };
  const candidate = event.candidates?.[0];
  return {
    text: candidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '',
    truncated: candidate?.finishReason === 'MAX_TOKENS',
  };
}
