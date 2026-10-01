import { describe, it, expect } from 'vitest';
import { createNdjsonParser, stripLeadingFence } from './streamEvents';

describe('createNdjsonParser', () => {
  it('줄 단위 JSON을 객체로 파싱한다', () => {
    const parse = createNdjsonParser();
    expect(parse('{"type":"delta","text":"a"}\n')).toEqual([{ type: 'delta', text: 'a' }]);
  });

  it('청크 경계에서 잘린 줄은 이어서 처리한다', () => {
    const parse = createNdjsonParser();
    expect(parse('{"type":"del')).toEqual([]);
    expect(parse('ta","text":"a"}\n{"type":"done"}\n')).toEqual([
      { type: 'delta', text: 'a' },
      { type: 'done' },
    ]);
  });
});

describe('stripLeadingFence', () => {
  it('맨 앞 코드펜스 줄을 제거한다', () => {
    expect(stripLeadingFence('```jsx\nconst A = 1;')).toBe('const A = 1;');
  });

  it('펜스가 없으면 그대로 둔다', () => {
    expect(stripLeadingFence('const A = 1;')).toBe('const A = 1;');
  });
});
