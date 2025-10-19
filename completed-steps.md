# Completed Migration Steps

- Phase 1: Added GitHub API wrapper (`lib/github-api.ts`) with Octokit helpers and fast-forward support.
- Phase 2: Added pending changes context (`app/admin/pending-changes-context.tsx`) with localStorage persistence and storage safeguards.
- Phase 3: Implemented publish server action (`app/admin/publish-action.ts`) to commit uploads/deletions to GitHub with concurrency safety and attribution.
- Phase 4: Added publish UI (`app/admin/publish-button.tsx`) with confirmation dialog, toast feedback, and pending storage safeguards.
- Phase 5: Reworked upload form (`app/admin/upload/upload-form.tsx`) to queue changes locally with size validation and pending-state toasts.
- Phase 6: Wrapped admin dashboard with pending state provider and publish UI (`app/admin/page.tsx`, `app/admin/pending-summary.tsx`).
- Phase 7: Updated markdown parsing to emit GitHub raw URLs with strict path sanitization (`lib/markdown-parser.ts`, `lib/articles-service.ts`).
- Phase 8: Allowed Next.js Image to load from GitHub raw endpoints (`next.config.mjs`).
