import { describe, it, expect } from 'vitest';
import { validatePrompt, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('500자를 넘으면 유효하지 않고 에러 메시지를 반환한다', () => {
    const result = validatePrompt('가'.repeat(MAX_PROMPT_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('프롬프트는 500자 이하로 입력해주세요.');
  });

  it('앞뒤 공백은 길이에 포함하지 않는다 (제출 시 trim되므로)', () => {
    const result = validatePrompt(`  ${'가'.repeat(MAX_PROMPT_LENGTH)}  `);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
