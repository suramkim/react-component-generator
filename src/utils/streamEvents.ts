// 서버가 보내는 NDJSON 스트림 이벤트를 다루는 순수 함수들.

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; message: string };

/** 청크를 받아 완성된 줄만 JSON으로 파싱해 반환한다. 잘린 줄은 버퍼에 보관한다. */
export function createNdjsonParser(): (chunk: string) => StreamEvent[] {
  let buffer = '';
  return (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    return lines.filter((line) => line.trim()).map((line) => JSON.parse(line) as StreamEvent);
  };
}

/** 스트리밍 중 보여줄 코드에서, 모델이 붙인 맨 앞 코드펜스 줄을 제거한다. */
export function stripLeadingFence(text: string): string {
  return text.replace(/^```\w*\n?/, '');
}
