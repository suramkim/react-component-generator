# AGENTS.md

## Operational Commands

- Package manager: `bun` only. Do not use npm/yarn/pnpm (lockfile is `bun.lock`).
- `bun install` — install dependencies
- `bun run dev` — API server (Bun, port 3002) and Vite (5173) together
- `bun run server` — API server only (`bun --watch run server/index.ts`)
- `bun run test` — Vitest single run (covers `src/**` and `server/**`); `bun run test:watch` for watch mode
- `bun run lint` — ESLint
- `bun run build` — `tsc -b && vite build`; run before declaring frontend work done

## Golden Rules

### Immutable
- API keys must stay server-side. Only the boolean presence of `.env` keys may reach the client (`server/index.ts:148-155`, `/api/config` returns `!!ENV_KEYS.*`). Never return key values.
- Never commit `.env` (`.gitignore`). Do not recreate real keys in any tracked file.
- Any change to `SYSTEM_PROMPT` output format must be mirrored in `server/generator.ts` and the live preview (see Hard Constraints below).

### Hard Constraints
- Generated code runs in `react-live` with `noInline` (`src/components/LivePreview.tsx:9`). It requires a `render(<X />)` call, no `import`, no TypeScript syntax. `server/index.ts:7-20` enforces this by prompt and `ensureRenderCall` (`server/generator.ts:16`) enforces it by post-processing. Keep both.
- Vite proxies `/api` to `localhost:3002` (`vite.config.ts:9-12`). If the server port changes, change both places.

### Double Defense
- Render-call guarantee is enforced twice: prompt instruction and `ensureRenderCall`. Do not remove one on the assumption the other suffices.

### Asymmetry
- Only the Google provider has model fallback (`GOOGLE_MODELS` + `withModelFallback`, `server/index.ts:5,134-136`). Anthropic uses a single fixed model (`server/index.ts:77`). Do not assume provider parity when changing error handling.
- Only the Google path detects truncation (`finishReason === 'MAX_TOKENS'`, `server/index.ts:123`).

### Test Boundary
- Tested: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`. Not tested: `server/index.ts` (side-effecting `Bun.serve`), `useComponentGenerator`, other components. Put new pure logic in a separate module (as `generator.ts` does) so it is testable; add tests alongside as `*.test.ts(x)`.

## Project Context

- Generates React components from a prompt via Anthropic Claude or Google Gemini and previews them live.
- Stack: React 19, TypeScript, Vite, Vitest + Testing Library, Bun server, react-live.

## Standards & References

- Docs: `README.md` (setup and features).
- Commits: `<type>[(scope)]: <Korean summary>` with types feat, fix, refactor, chore, docs, test. No push or PR unless asked.
- User-facing strings and comments are Korean.
- Maintenance Policy: if a rule here diverges from the code, propose an update to this file instead of silently ignoring it. Known drift: `README.md` references `.env.example`, which was deleted from the working tree.
