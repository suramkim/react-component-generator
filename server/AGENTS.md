# server/AGENTS.md

## Module Context

Bun HTTP server (`Bun.serve`, port 3002) proxying generation requests to Anthropic and Google. Runs under Bun, not Node; do not add Express or similar.

## Implementation Patterns

- Keep `index.ts` thin on logic: pure helpers go in their own module with a sibling `*.test.ts` (`generator.ts`, `fallback.ts`).
- Every `Response` must include `CORS_HEADERS` (`index.ts:51`), including errors and the 404.
- Provider calls use raw `fetch`, no SDKs. Errors are thrown as `new Error('<Provider> API error: <status>')`; the handler maps status by substring match on `'503'` / `'429'` (`index.ts:194-206`). Keep that message shape or update the mapping.
- `resolveApiKey` prefers the client-supplied key over the env key (`index.ts:64-66`).

## Testing Strategy

- `bun run test` (Vitest, `server/**/*.test.ts` included via `vite.config.ts:20`).

## Local Golden Rules

- Do not log or echo API keys. The Google URL embeds the key as a query parameter (`index.ts:99`); never log that URL or include it in thrown error messages.
- `withModelFallback` swallows every error until the last model; do not use it for errors that should abort immediately (e.g. missing key).
- Adding a Google model: append to `GOOGLE_MODELS` in priority order (`index.ts:5`).
