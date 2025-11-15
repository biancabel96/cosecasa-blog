# Fluid Active CPU Mitigation Plan

## 1. Scope Clerk middleware only where it is required

1. Update `middleware.ts` to avoid the current catch-all matcher (`/((?!.+\.[\w]+$|_next).*)`). Instead, match only the paths that actually need Clerk checks (`/admin/:path*`, `/api/admin/:path*`, and any other private endpoints). Vercel will then serve all public pages directly from the CDN without running an Edge/auth function.
2. Keep the existing runtime guard inside `app/admin/layout.tsx` as a defense-in-depth check. This guarantees the admin UI still redirects unauthenticated users even if they somehow bypass middleware.
3. After narrowing the matcher, redeploy and verify via Vercel analytics that the majority of public traffic now bypasses Edge compute and that Fluid Active CPU drops accordingly.

## 2. Avoid reparsing the entire articles repository on every cache miss

1. Split the Markdown ingestion into two layers:
   - A build-time (or on-demand server action) job that walks `articles/*`, parses `text.md`, and emits a lightweight JSON manifest (metadata + rendered HTML) under `public/data/articles.json` or a KV entry.
   - A runtime helper (`lib/markdown.tsx`) that first checks the manifest and only fetches a single slug from GitHub if it is missing.
2. Replace the current `cache(fetchArticlesFromGitHub)` with a persistent cache (Vercel KV / Edge Config / Turso) so cold starts don’t force every request to re-list, re-download, and re-render all Markdown files.
3. Modify the admin publish flow:
   - After committing to GitHub, update just the affected slug(s) in the persistent cache manifest (either via server action or webhook) instead of calling `clearArticlesCache()`.
   - Revalidate only the paths touched by the change (`revalidatePath("/[slug]")` and the homepage/tag pages if their content actually changed).
4. During migration, add a feature flag to fall back to the old behavior if the manifest is missing. Once stable, remove the expensive GitHub full-scan from the critical request path.

## 3. Make the admin repo explorer less CPU-intensive

1. Keep `/admin` dynamic, but memoize GitHub directory listings with `cache()` + a short TTL (or the same persistent cache used for articles). Each folder navigation currently issues live `listDirectoryContents` calls and an extra `getFileContent` download; caching these responses will dramatically reduce repeated API work.
2. Lazy-load article Markdown only when an editor action requires it (draft toggle, delete confirmation), and debounce repeated reads per slug.
3. Evaluate moving the explorer to the client side: expose a tiny API route that proxies GitHub data and let the React client poll as needed. That keeps most admin interactions off the server runtime altogether.
4. Add instrumentation around the admin actions (GitHub list/get, publish, cache clear) to confirm CPU time shrinks after the caching changes.

## Rollout

1. Implement middleware scoping first (low risk, immediate CPU win).
2. Introduce the persistent article manifest + targeted revalidation. Validate in preview, then enable in production.
3. Optimize the admin explorer interactions once traffic confirms the first two fixes, ensuring staff workflows stay responsive without keeping the runtime hot.
