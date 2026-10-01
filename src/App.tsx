import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { TitleBar } from './components/TitleBar';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import { STORAGE_KEYS, readStorage, writeStorage } from './utils/storage';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function formatClock(date: Date) {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [apiKey, setApiKey] = useState(() =>
    readStorage(STORAGE_KEYS.apiKey, '', (raw) => (typeof raw === 'string' ? raw : undefined)),
  );
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>(() =>
    readStorage<Provider>(STORAGE_KEYS.provider, 'google', (raw) =>
      raw === 'anthropic' || raw === 'google' ? raw : undefined,
    ),
  );
  const [keyError, setKeyError] = useState<string | null>(null);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, promptHistory, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    writeStorage(STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.provider, provider);
  }, [provider]);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(formatClock(new Date())), 15_000);
    return () => clearInterval(timer);
  }, []);

  const hasEnvKey = envKeys[provider];
  const activeProvider = PROVIDER_CONFIG[provider].label;
  const visibleError = keyError ?? error;

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      setKeyError(
        `${activeProvider} API 키가 없습니다. 실행 설정에 키를 입력하거나 서버 .env에 설정하세요.`,
      );
      return;
    }
    setKeyError(null);
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
    setKeyError(null);
  };

  return (
    <div className="desktop">
      <header className="menubar">
        <h1 className="menubar-title">
          <span className="menubar-mark" aria-hidden="true" />
          React 컴포넌트 생성기
        </h1>
        <dl className="menubar-status" aria-label="현재 작업 상태">
          <div>
            <dt>모델</dt>
            <dd>{activeProvider}</dd>
          </div>
          <div>
            <dt>만든 컴포넌트</dt>
            <dd>{components.length}개</dd>
          </div>
          <div className="menubar-clock">
            <dt className="visually-hidden">현재 시각</dt>
            <dd>{clock}</dd>
          </div>
        </dl>
      </header>

      <main className="workspace">
        <section className="window composer-window" aria-labelledby="composer-title">
          <TitleBar id="composer-title" title="새 컴포넌트" />
          <div className="window-body">
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={promptHistory} />
          </div>
        </section>

        <aside className="window settings-window" aria-labelledby="settings-title">
          <TitleBar id="settings-title" title="실행 설정" />
          <div className="window-body">
            <fieldset className="provider-group">
              <legend>AI 모델</legend>
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <label key={key} className="radio">
                  <input
                    type="radio"
                    name="provider"
                    value={key}
                    checked={provider === key}
                    onChange={() => handleProviderChange(key as Provider)}
                  />
                  <span>{label}</span>
                  {envKeys[key as Provider] && <span className="radio-note">서버 키 있음</span>}
                </label>
              ))}
            </fieldset>

            <div className="api-key-input">
              <label htmlFor="api-key">{activeProvider} API 키</label>
              <div className="api-key-field">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyError(null);
                  }}
                  placeholder={hasEnvKey ? '비워두면 서버 키 사용' : PROVIDER_CONFIG[provider].placeholder}
                />
                <button className="btn" onClick={() => setShowKey(!showKey)} type="button">
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                {hasEnvKey
                  ? '서버 .env의 키로 생성합니다. 입력하면 그 키를 대신 씁니다.'
                  : '키를 입력하거나 서버 .env에 설정하세요.'}
              </p>
            </div>
          </div>
        </aside>
      </main>

      {visibleError && (
        <div className="window alert" role="alert">
          <span className="alert-icon" aria-hidden="true">!</span>
          <p>{visibleError}</p>
        </div>
      )}

      <section className="results" aria-label="생성된 컴포넌트">
        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트 {components.length}개</h2>
            <button className="btn btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {isLoading && (
          <div className="window loading-window" role="status">
            <TitleBar title="생성 중" />
            <div className="window-body">
              <p>{activeProvider} 모델이 컴포넌트를 만들고 있습니다.</p>
              <div className="progress" aria-hidden="true">
                <div className="progress-bar" />
              </div>
            </div>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="empty-state">
            <p className="empty-title">아직 만든 컴포넌트가 없습니다</p>
            <p>위에 원하는 UI를 적고 컴포넌트 생성을 누르면, 결과가 이 자리에 창으로 열립니다.</p>
          </div>
        )}

        <div className="results-list">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
