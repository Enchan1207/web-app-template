# AGENTS.md

## project overview

- purpose: build web application
- language: TypeScript
- frameworks:
  - frontend:
    - base: React
    - UI: shadcn/ui, TailwindCSS
  - backend:
    - base: Hono
    - ORM: Drizzle
- formatter: Prettier
- linter: ESLint
- deployment infrastructure
  - compute: Cloudflare Workers (with static assets)
  - database: Cloudflare D1

## scripts

- `pnpm -F app dev`: run development server
- `pnpm -F app build`: build project
- `pnpm prettier /path/to/file`: check format
- `pnpm prettier:fix /path/to/file`: check and fix format
- `pnpm lint /path/to/file`: lint
- `pnpm lint:fix /path/to/file`: lint and fix

## rules

**NOTE**: You MUST follow these rules

- When you emit a document, comment, or commit message, you MUST written them in Japanese.
- You MUST NOT modify any IaC code (./infra, ./packages/infra-scripts).
- styling, components:
  - You MUST NOT add any CSS. Inlines and properties are no exception.
  - If you want to add new components, shadcn/ui should be your first choice, followed by TailwindCSS.
- naming conventions:
  - variables,functions: lowerCamelCase
  - classes,constants,components: PascalCase
  - module: kebab-case
- follow the guidelines:
  - testing: @ docs/architecture-guideline/testing.md
  - backend: @ docs/architecture-guideline/backend.md

### forbidden operations

- Re-generating shadcn/ui components.
- Adding custom CSS files or inline styles.
- Introducing global side effects (e.g. modifying `window` at module scope).

### change rationale

- When modifying existing code, agents MUST:
  - Preserve existing behavior unless a change is explicitly required.
  - Briefly explain the reason for the change in the commit message or response.

### commit message rules (conventional commits)

- Commit messages MUST follow Conventional Commits:
  - format: `<type>(<scope>): #<issue_number> <subject>`
  - `<scope>` is recommended; omit only when it adds no value.
  - `#<issue_number>` is needed only if the name of branch starts `f/[0-9]+-`.
  - `<subject>` MUST written in Japanese.
- Allowed `<type>`:
  - `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Subject line rules:
  - Use imperative mood (e.g. "add", "fix", "update").
  - No trailing period.
  - Keep it concise (aim ≤ 100 chars).
