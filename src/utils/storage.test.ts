import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addPromptHistory,
  readStorage,
  reviveComponents,
  writeStorage,
} from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('readStorage / writeStorage', () => {
  it('저장한 값을 그대로 읽어온다', () => {
    writeStorage('k', { a: 1 });
    expect(readStorage('k', null)).toEqual({ a: 1 });
  });

  it('값이 없으면 fallback을 반환한다', () => {
    expect(readStorage('missing', 'fallback')).toBe('fallback');
  });

  it('JSON이 깨져 있으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });

  it('parse가 undefined를 반환하면 fallback을 반환한다', () => {
    writeStorage('k', 123);
    const parse = (raw: unknown) => (typeof raw === 'string' ? raw : undefined);
    expect(readStorage('k', 'fallback', parse)).toBe('fallback');
  });

  it('localStorage 쓰기가 실패해도 예외를 던지지 않는다', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeStorage('k', 1)).not.toThrow();
    spy.mockRestore();
  });
});

describe('reviveComponents', () => {
  it('createdAt 문자열을 Date로 복원한다', () => {
    const iso = '2026-10-01T09:30:00.000Z';
    const result = reviveComponents([{ id: '1', prompt: 'p', code: 'c', createdAt: iso }]);
    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe(iso);
  });

  it('형식이 잘못된 항목은 걸러낸다', () => {
    const result = reviveComponents([
      { id: '1', prompt: 'p', code: 'c', createdAt: '2026-10-01T09:30:00.000Z' },
      { id: '2', prompt: 'p' },
      { id: '3', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
      null,
    ]);
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(reviveComponents({ foo: 1 })).toEqual([]);
  });
});

describe('addPromptHistory', () => {
  it('최신 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPromptHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 맨 앞으로 옮기고 하나만 남긴다', () => {
    expect(addPromptHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('최대 개수를 넘으면 오래된 항목을 버린다', () => {
    expect(addPromptHistory(['a', 'b'], 'c', 2)).toEqual(['c', 'a']);
  });
});
