# Static-Generation Improvements

## Goal
Turn every public page (`/`, `/about`, `/[slug]`, `/tag/[tag]`, etc.) into a pure build-time artifact so that the only dynamic surface left is the CMS that lives under `/admin` and its authentication routes. The CMS can stay dynamic because it needs Clerk and the GitHub APIs, but the magazine experience should be able to deploy on Vercel without any runtime data dependencies.

## Current Findings
- Public routes call `getAllPosts`, `getPostBySlug` and `getAllTags` (`app/page.tsx`, `app/[slug]/page.tsx`, `app/tag/[tag]/page.tsx`). These helpers are implemented in `lib/markdown.tsx`, which in turn hits the GitHub REST API through `lib/articles-service.ts` → `lib/github-api.ts`. That means every build (and every dynamic render) requires `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH`. If those env vars are not present the build fails, so the site is not self-contained even though all markdown already lives under `/articles`.
- The markdown parser rewrites every relative image reference to `https://raw.githubusercontent.com/...` via `getRawFileUrl` (`lib/markdown-parser.ts`). As a result, the generated HTML for each post cannot be served without a GitHub URL and the `next.config.mjs` image remote pattern. None of the article media is copied to `public/`, so the static build would still depend on GitHub.
- The CMS (`app/admin`) writes markdown and images back to the repo using Octokit (`app/admin/publish-action.ts`). After publishing it manually calls `refreshArticlesCache` and `revalidatePath` so that the same server instance can serve the new article immediately instead of waiting for a new deployment.
- `ClerkProvider` is mounted in `app/layout.tsx`, so every route (even `/about`) loads Clerk’s client bundle even though only `/admin` and `/sign-in` actually need it.
- The portfolio project (`/Users/theinkedengineer/Code/Bianca/bianca-portfolio`) shows the target workflow: every asset is stored locally (`src/assets/**/*`), components import those files directly (`src/pages/home.tsx`, etc.), and `vite build` emits fully static HTML/JS without any API calls at runtime.

## Missing Work to Reach a Fully Static Front-End

1. **Introduce a build-time content pipeline**
   - Create a script (e.g. `scripts/build-articles.ts`) that scans `/articles/*/text.md`, parses frontmatter + markdown with the existing `lib/markdown-parser.ts`, and emits a JSON snapshot (for example `generated/articles.json` which already exists but is not wired up). The script should also record derived metadata (slug, excerpt, tags, dates) so that public components can import it synchronously.
   - Add an npm script (`"prebuild": "ts-node scripts/build-articles.ts"` or similar) so `next build` always runs the generator before compiling. This mirrors the Vite project where static assets are part of the repo and baked into the bundle.

2. **Switch public data helpers to the generated dataset**
   - Replace the GitHub-backed implementation in `lib/markdown.tsx` with one that imports the JSON snapshot (or reads from the filesystem synchronously during the build) and exposes the same API (`getAllPosts`, `getPostBySlug`, etc.). Only the CMS should keep using the Octokit utilities; public routes must not import `lib/github-api.ts`.
   - Remove the ad-hoc cache/mutation helpers (`refreshArticlesCache`, `removeArticlesFromCache`) from the public surface once GitHub is out of the path. After this change, `getAllPosts` becomes a pure read that works without any env vars.

3. **Serve article media from the build output**
   - Extend the generator to copy every non-markdown file from `/articles/<slug>/` into something under `public/articles/<slug>/` (or emit hashed assets and import them). Update `lib/markdown-parser.ts` so that relative markdown paths become `/articles/<slug>/<filename>` instead of pointing to `raw.githubusercontent.com`.
   - After copying the assets locally, drop the `getRawFileUrl` dependency, remove the `images.remotePatterns` entry in `next.config.mjs`, and let `next/image` handle them as normal static files. This keeps the entire article (text + media) inside the deployable artifact.

4. **Isolate GitHub + Clerk dependencies inside the CMS**
   - Move the `ClerkProvider` out of `app/layout.tsx` and into a route group/layout that only wraps `/admin` and `/sign-in`. This keeps Clerk’s client bundles and runtime auth hooks away from the statically generated magazine pages.
   - Ensure `lib/github-api.ts` and `lib/github-cache.ts` are only imported from the CMS tree (server actions, upload tooling, repo explorer). This prevents Octokit from being bundled into the static routes and avoids leaking the GitHub env vars into the public build.

5. **Change the publish flow to rely on Git-triggered rebuilds**
   - Once the public site no longer reads directly from GitHub, the `revalidatePath` calls inside `app/admin/publish-action.ts` can be removed. Instead, rely on the GitHub commit (already performed there) to trigger a Vercel build, exactly like the Vite project does.
   - Optionally add a Vercel deploy hook call after a successful commit if you need to guarantee the rebuild starts immediately.

6. **Clean up legacy fallbacks**
   - Remove the unused `mockArticles` / `mockCategories` exports in `lib/content.tsx` and wire every consumer to the generated dataset so there is a single source of truth.
   - Delete the orphaned `generated/articles.json` once the generator owns that file; make sure `.gitignore` (if any) and TypeScript types line up so importing the JSON works in both dev and build.

After these changes the workflow becomes:
1. CMS pushes markdown + images into `/articles` via GitHub.
2. GitHub commit triggers Vercel.
3. `prebuild` runs the article generator, Next.js imports the JSON + media, and every public route is rendered statically without requiring Clerk or GitHub credentials.
