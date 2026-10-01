import { describe, it, expect } from 'vitest';
import { createSSEParser, extractAnthropicText, extractGeminiChunk } from './stream';

describe('createSSEParser', () => {
  it('완성된 data 줄의 페이로드를 반환한다', () => {
    const parse = createSSEParser();
    expect(parse('data: {"a":1}\n\n')).toEqual(['{"a":1}']);
  });

  it('청크 경계에서 잘린 줄은 다음 청크와 합쳐 처리한다', () => {
    const parse = createSSEParser();
    expect(parse('data: {"a"')).toEqual([]);
    expect(parse(':1}\n\ndata: {"b":2}\n\n')).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('data가 아닌 줄(event:, 빈 줄)은 무시한다', () => {
    const parse = createSSEParser();
    expect(parse('event: content_block_delta\ndata: {"a":1}\n\n')).toEqual(['{"a":1}']);
  });
});

describe('extractAnthropicText', () => {
  it('content_block_delta의 text_delta 텍스트를 반환한다', () => {
    const data = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'const' } });
    expect(extractAnthropicText(data)).toBe('const');
  });

  it('텍스트가 없는 이벤트는 빈 문자열을 반환한다', () => {
    expect(extractAnthropicText(JSON.stringify({ type: 'message_start' }))).toBe('');
  });
});

describe('extractGeminiChunk', () => {
  it('parts의 텍스트를 이어붙여 반환한다', () => {
    const data = JSON.stringify({ candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] });
    expect(extractGeminiChunk(data)).toEqual({ text: 'ab', truncated: false });
  });

  it('finishReason이 MAX_TOKENS면 truncated=true', () => {
    const data = JSON.stringify({ candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'MAX_TOKENS' }] });
    expect(extractGeminiChunk(data)).toEqual({ text: 'x', truncated: true });
  });
});
