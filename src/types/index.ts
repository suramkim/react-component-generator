export type Provider = 'anthropic' | 'google';

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
  /** LLM 응답을 받는 중이면 true. code는 아직 미완성이다. */
  isStreaming?: boolean;
}
