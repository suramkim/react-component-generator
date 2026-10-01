import { useState, useEffect, useRef } from 'react';

interface CodeViewProps {
  code: string;
  isStreaming?: boolean;
}

export function CodeView({ code, isStreaming }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const blockRef = useRef<HTMLPreElement>(null);

  // 스트리밍 중에는 새 코드가 보이도록 맨 아래로 따라간다.
  useEffect(() => {
    const el = blockRef.current;
    if (isStreaming && el) el.scrollTop = el.scrollHeight;
  }, [code, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel">
      <button className="btn btn-copy" onClick={handleCopy} aria-live="polite" disabled={isStreaming}>
        {copied ? '복사됨' : '코드 복사'}
      </button>
      <pre className="code-block" ref={blockRef}>
        <code>{code || (isStreaming ? '응답을 기다리는 중...' : '')}</code>
        {isStreaming && <span className="code-cursor" aria-hidden="true" />}
      </pre>
    </div>
  );
}
