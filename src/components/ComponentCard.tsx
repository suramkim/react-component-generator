import { useState } from 'react';
import type { GeneratedComponent } from '../types';
import { LivePreview } from './LivePreview';
import { CodeView } from './CodeView';
import { TitleBar } from './TitleBar';

interface ComponentCardProps {
  component: GeneratedComponent;
  onRemove: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  isLoading: boolean;
}

type Tab = 'preview' | 'code';

export function ComponentCard({ component, onRemove, onRegenerate, isLoading }: ComponentCardProps) {
  // 스트리밍 중에는 코드 탭 고정, 끝나면 사용자가 고르기 전까지 미리보기 탭.
  const [selectedTab, setActiveTab] = useState<Tab | null>(null);
  const activeTab: Tab = component.isStreaming ? 'code' : (selectedTab ?? 'preview');
  const [previewKey, setPreviewKey] = useState(0);

  const createdAt = component.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="window component-window">
      <TitleBar
        title={component.prompt}
        onClose={() => onRemove(component.id)}
        closeLabel="삭제"
      />
      <div className="window-toolbar">
        <div className="segmented" role="group" aria-label="보기 전환">
          <button
            className="segment"
            aria-pressed={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
            disabled={component.isStreaming}
          >
            미리보기
          </button>
          <button
            className="segment"
            aria-pressed={activeTab === 'code'}
            onClick={() => setActiveTab('code')}
          >
            코드
          </button>
        </div>
        <span className="toolbar-time">{component.isStreaming ? '생성 중...' : `${createdAt} 생성`}</span>
        <div className="toolbar-actions">
          {activeTab === 'preview' && (
            <button className="btn" onClick={() => setPreviewKey((k) => k + 1)}>
              처음부터 재생
            </button>
          )}
          <button
            className="btn"
            onClick={() => onRegenerate(component.prompt)}
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '재생성'}
          </button>
        </div>
      </div>
      <div className="window-content">
        {activeTab === 'preview' ? (
          <LivePreview key={previewKey} code={component.code} />
        ) : (
          <CodeView code={component.code} isStreaming={component.isStreaming} />
        )}
      </div>
    </article>
  );
}
