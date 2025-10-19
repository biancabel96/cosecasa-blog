# Preview Mode Implementation Plan

## Overview

Currently, articles uploaded through the admin panel are stored in browser localStorage as "pending changes" until they are published to GitHub. Once published, they appear on the website. However, there's no way to preview how pending articles will look in the article list before publishing them.

This document outlines a **Preview Mode** system that allows authenticated admins to see pending articles alongside published ones, with clear visual indicators distinguishing drafts from published content.

---

## Current System Analysis

### Upload Flow
1. **Upload Page** (`app/admin/upload/upload-form.tsx`)
   - User uploads `.md` file with YAML frontmatter (title, date, tags, description)
   - Optional images can be attached
   - Markdown frontmatter is validated and title extracted
   - Files converted to data URLs
   - Stored in browser localStorage via `PendingChangesContext`

2. **Pending Changes Storage** (`app/admin/pending-changes-context.tsx`)
   - All changes stored in localStorage with key `"cosecase-admin-pending"`
   - Maximum storage: 4MB
   - Three types of changes:
     - `uploads`: New or updated articles
     - `deletes`: Articles marked for deletion
     - `imageDeletes`: Individual images marked for deletion
   - State persists across page refreshes
   - **Critical**: Changes exist ONLY in browser, NOT on GitHub

3. **Publishing Flow** (`app/admin/publish-action.ts`)
   - User clicks "Publish" button in admin panel
   - All pending changes batched into single Git commit
   - Markdown files uploaded as blobs to GitHub
   - Images uploaded as blobs from base64 data URLs
   - Tree created, commit created, main branch updated
   - Cache cleared via `clearArticlesCache()`
   - Paths revalidated with Next.js `revalidatePath()`

4. **Article Display** (`lib/articles-service.ts` + `lib/markdown.tsx`)
   - `fetchArticlesFromGitHub()` fetches articles from GitHub `articles/` directory
   - Each article = folder with `text.md` + optional images
   - Uses `banner.*` image for thumbnails (banner.png, banner.jpg, etc.)
   - Returns `ArticleRecord[]` array
   - Cached with React's `cache()` function
   - **Critical limitation**: Only sees published articles on GitHub

### The Problem

**Pending articles are completely invisible to the public website** because:
- They exist only in browser localStorage
- `fetchArticlesFromGitHub()` can only see published articles on GitHub
- They don't appear in article lists, search, or navigation
- No way to preview how they'll look before publishing
- Admin must publish to GitHub to see the article in context

---

## Solution: Preview Mode System

### Goals

1. ✅ Allow authenticated admins to preview pending articles
2. ✅ Show pending articles in main article list with visual indicators
3. ✅ Enable clicking through to view full pending article
4. ✅ Clear visual distinction between drafts and published content
5. ✅ No changes to publishing flow or GitHub storage
6. ✅ Works seamlessly with existing pending changes system
7. ✅ Only visible to authenticated admin users

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PreviewModeProvider (Context)                              │
│  - isPreviewMode: boolean (persisted to localStorage)       │
│  - togglePreviewMode()                                      │
│  - isReady: boolean                                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin Layout / Header                                      │
│  - Preview Mode Toggle Button                              │
│  - Badge showing count of draft articles                    │
│  - Visual indicator when preview mode is ON                 │
│  - Only visible to authenticated users                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  HomePage (app/page.tsx)                                    │
│  - Server: Fetch published articles from GitHub            │
│  - Client: Check if preview mode is ON                     │
│    • If ON: Read pending uploads from localStorage         │
│    • Parse markdown client-side (gray-matter + unified)    │
│    • Merge pending + published articles                    │
│    • Add isDraft flag to pending articles                  │
│  - Pass combined list to HomePageClient                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  HomePageClient (app/home-page-client.tsx)                 │
│  - Render all articles (published + drafts)                │
│  - Show "BOZZA" badge on draft articles                    │
│  - Apply visual styling (dashed border, slightly faded)    │
│  - Make draft articles clickable                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Article Detail Page (app/[slug]/page.tsx)                 │
│  - Check if slug exists in published articles (GitHub)     │
│  - If NOT found AND preview mode ON:                       │
│    • Check if slug exists in pending uploads               │
│    • Parse markdown from localStorage                      │
│    • Render article with "DRAFT" banner                    │
│  - If found: Render normally from GitHub                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Preview Mode Context

**File**: `app/admin/preview-mode-context.tsx`

**Purpose**: Manage preview mode state globally with localStorage persistence

**Key Features**:
- Boolean state for preview mode on/off
- Persist state to localStorage key `"cosecase-preview-mode"`
- Hydration-safe (check `isReady` before rendering)
- Export `usePreviewMode()` hook

**Interface**:
```typescript
interface PreviewModeContextValue {
  isPreviewMode: boolean
  togglePreviewMode: () => void
  isReady: boolean
}
```

**Implementation Notes**:
- Similar pattern to `pending-changes-context.tsx`
- Load from localStorage on mount
- Save to localStorage on change
- Wrap app in provider

---

### Step 2: Create Preview Articles Utility

**File**: `lib/preview-articles.ts`

**Purpose**: Transform pending uploads into renderable article objects

**Key Functions**:

#### 2.1 `parsePendingArticle(upload: PendingUpload): Promise<Post>`
- Takes a `PendingUpload` from localStorage
- Parses markdown content using `gray-matter`
- Extracts frontmatter (title, date, description, tags)
- Converts markdown to HTML using `unified` + `remark` + `rehype`
- Handles image data URLs (create object URLs for preview)
- Returns `Post` object matching existing interface

#### 2.2 `mergePendingAndPublishedArticles(published: Post[], pending: PendingUpload[]): Promise<Post[]>`
- Combines published articles from GitHub with pending from localStorage
- Parses each pending upload into Post format
- Adds `isDraft: true` flag to pending articles
- Removes duplicates (prefer pending version if slug matches)
- Sorts by date (newest first)
- Returns merged array

#### 2.3 `getPendingArticleBySlug(slug: string): Promise<Post | null>`
- Reads pending uploads from localStorage
- Finds matching slug
- Parses and returns as Post
- Returns null if not found

**Dependencies**:
- `gray-matter`: Parse YAML frontmatter
- `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`: Markdown processing
- `rehype-highlight`, `rehype-stringify`: HTML generation
- Reuse existing markdown parsing logic from `lib/markdown-parser.ts`

**Implementation Notes**:
- Must work client-side (uses localStorage)
- Handle image data URLs carefully:
  - Extract base64 from data URL
  - Create blob URLs for preview
  - Clean up blob URLs on unmount
- Error handling for malformed markdown
- Performance: Parse markdown only once per article

---

### Step 3: Add Preview Mode Toggle to Admin UI

**File**: `app/admin/preview-mode-toggle.tsx` (new component)

**Purpose**: UI control for enabling/disabling preview mode

**Features**:
- Toggle button/switch
- Show current state (ON/OFF)
- Display count of draft articles
- Icon to indicate preview mode
- Tooltip explaining feature

**Design**:
```tsx
<Button variant="outline" onClick={togglePreviewMode}>
  <Eye className={isPreviewMode ? "text-brand-primary" : "text-muted-foreground"} />
  {isPreviewMode ? "Modalità Anteprima: ON" : "Modalità Anteprima: OFF"}
  {draftCount > 0 && <Badge>{draftCount} bozze</Badge>}
</Button>
```

**Integration**:
- Add to `app/admin/layout.tsx` header
- Position near "Pubblica" button
- Only visible to authenticated users

---

### Step 4: Update Admin Layout

**File**: `app/admin/layout.tsx`

**Changes**:
1. Import `PreviewModeProvider`
2. Wrap children with provider
3. Add `PreviewModeToggle` to header area

**Example**:
```tsx
export default function AdminLayout({ children }) {
  return (
    <PendingChangesProvider>
      <PreviewModeProvider>
        <div>
          <header>
            {/* Existing header content */}
            <PreviewModeToggle />
          </header>
          {children}
        </div>
      </PreviewModeProvider>
    </PendingChangesProvider>
  )
}
```

---

### Step 5: Update Homepage to Support Preview

**File**: `app/page.tsx`

**Changes**:
1. Keep server-side fetch of published articles
2. Make client component that checks preview mode
3. If preview mode ON: merge pending articles
4. Pass combined list to `HomePageClient`

**Architecture Options**:

**Option A: Hybrid Approach (Recommended)**
- Server component fetches published articles
- Client wrapper checks preview mode
- Merges on client if needed

**Option B: Full Client Component**
- Convert entire page to client component
- Fetch published articles client-side
- Merge with pending if preview mode ON

**Recommended Implementation (Option A)**:
```tsx
// app/page.tsx (server component)
export default async function HomePage() {
  const publishedArticles = await getAllPosts()
  const categories = await getAllTags()

  return (
    <HomePageWithPreview
      publishedArticles={publishedArticles}
      categories={categories}
    />
  )
}

// app/home-page-with-preview.tsx (client component)
"use client"
export function HomePageWithPreview({ publishedArticles, categories }) {
  const { isPreviewMode, isReady } = usePreviewMode()
  const { state } = usePendingChanges()
  const [articles, setArticles] = useState(publishedArticles)

  useEffect(() => {
    if (!isReady || !isPreviewMode) {
      setArticles(publishedArticles)
      return
    }

    // Merge pending articles
    mergePendingAndPublishedArticles(publishedArticles, state.uploads)
      .then(setArticles)
  }, [isPreviewMode, isReady, state.uploads, publishedArticles])

  return <HomePageClient articles={articles} categories={categories} />
}
```

---

### Step 6: Update Article List UI

**File**: `app/home-page-client.tsx`

**Changes**:
1. Update `Article` interface to include optional `isDraft` flag
2. Render "BOZZA" badge for draft articles
3. Apply visual styling to distinguish drafts

**Visual Design for Draft Articles**:
- Badge: "BOZZA" in orange/amber color
- Border: Dashed instead of solid
- Opacity: Slightly reduced (90%)
- Icon: Eye or draft indicator

**Example**:
```tsx
interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  date: string
  categories: string[]
  categorySlug: string
  isDraft?: boolean  // NEW
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className={cn(
      "transition hover:shadow-lg",
      article.isDraft && "border-dashed border-amber-500/50 opacity-90"
    )}>
      <div>
        {article.isDraft && (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            <Eye className="h-3 w-3 mr-1" />
            BOZZA
          </Badge>
        )}
        {/* Rest of card content */}
      </div>
    </Card>
  )
}
```

---

### Step 7: Update Article Detail Page

**File**: `app/[slug]/page.tsx`

**Changes**:
1. Try to fetch article from GitHub (existing logic)
2. If not found AND preview mode ON: check pending uploads
3. If found in pending: parse and render with "DRAFT" banner
4. If not found anywhere: show 404

**Implementation**:
```tsx
// Server component
export default async function ArticlePage({ params }) {
  const { slug } = params

  // Try published first
  const publishedArticle = await getPostBySlug(slug)
  if (publishedArticle) {
    return <ArticleView article={publishedArticle} />
  }

  // Not found - let client check pending
  return <ArticleViewWithPreview slug={slug} />
}

// Client component
"use client"
function ArticleViewWithPreview({ slug }) {
  const { isPreviewMode, isReady } = usePreviewMode()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isReady) return

    if (!isPreviewMode) {
      setLoading(false)
      return
    }

    getPendingArticleBySlug(slug)
      .then(setArticle)
      .finally(() => setLoading(false))
  }, [slug, isPreviewMode, isReady])

  if (loading) return <LoadingSpinner />
  if (!article) return <NotFound />

  return (
    <>
      <DraftBanner />
      <ArticleView article={article} isDraft />
    </>
  )
}
```

**Draft Banner Component**:
```tsx
function DraftBanner() {
  return (
    <div className="bg-amber-50 border-b-2 border-amber-500 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800">
          <strong>Anteprima Bozza</strong> — Questo articolo non è ancora pubblicato. Solo tu puoi vederlo.
        </p>
      </div>
    </div>
  )
}
```

---

## Additional Considerations

### Image Handling

**Pending Images**:
- Stored as base64 data URLs in localStorage
- Need to convert to blob URLs for preview
- Clean up blob URLs to prevent memory leaks

**Implementation**:
```typescript
function createImageBlobUrl(dataUrl: string): string {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'

  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }

  const blob = new Blob([array], { type: mime })
  return URL.createObjectURL(blob)
}

// Clean up on unmount
useEffect(() => {
  const urls = imageBlobUrls
  return () => {
    urls.forEach(url => URL.revokeObjectURL(url))
  }
}, [])
```

### Performance

**Optimization Strategies**:
1. Parse markdown only once per article (memoize)
2. Use React.memo for article cards
3. Lazy load preview articles (only when preview mode ON)
4. Debounce preview mode toggle to avoid rapid re-renders
5. Cache parsed articles in memory (WeakMap by slug)

### Security

**Access Control**:
- Preview mode only for authenticated users
- Check auth status before showing toggle
- Server-side protection not needed (localStorage is client-only)
- Published articles remain publicly accessible

**Data Validation**:
- Validate markdown frontmatter before parsing
- Sanitize HTML output (use same process as published articles)
- Validate image data URLs before creating blobs

### Error Handling

**Scenarios**:
1. **Malformed markdown**: Show error badge, skip article
2. **Missing frontmatter**: Use default values (title = slug, date = now)
3. **Invalid image data**: Show placeholder image
4. **LocalStorage quota exceeded**: Show warning, disable preview mode
5. **Parse errors**: Log to console, show error UI

**Error UI**:
```tsx
function DraftArticleError({ slug, error }) {
  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <XCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">Errore nel caricamento della bozza</p>
            <p className="text-sm text-muted-foreground">{slug}</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### User Experience

**Onboarding**:
- First time preview mode is enabled: show tooltip/popover explaining feature
- Link to docs/help from toggle button

**Visual Feedback**:
- Toast notification when preview mode toggled
- Persistent indicator in header when preview mode ON
- Badge count updates in real-time as drafts added/removed

**Accessibility**:
- ARIA labels for preview mode toggle
- Screen reader announcements for draft badges
- Keyboard navigation support
- Focus management

---

## Testing Strategy

### Unit Tests

1. **Preview Mode Context**
   - Toggle state changes
   - localStorage persistence
   - Hydration safety

2. **Preview Articles Utility**
   - Markdown parsing
   - Frontmatter extraction
   - Merging logic
   - Image URL conversion

3. **Article Merging**
   - Duplicate handling (prefer pending)
   - Date sorting
   - isDraft flag assignment

### Integration Tests

1. **Upload → Preview Flow**
   - Upload article in admin
   - Enable preview mode
   - Verify article appears in list
   - Click through to detail page
   - Verify full article renders

2. **Publish Flow**
   - Upload article
   - Preview it
   - Publish to GitHub
   - Verify draft badge removed
   - Verify article still visible

3. **Multi-Article Scenarios**
   - Multiple pending articles
   - Mix of pending + published
   - Duplicate slugs (pending overrides published)

### Manual Testing Checklist

- [ ] Toggle preview mode on/off
- [ ] Upload new article, see it in preview
- [ ] Click draft article, view full content
- [ ] Upload article with images, verify images display
- [ ] Publish article, verify draft badge removed
- [ ] Disable preview mode, verify drafts hidden
- [ ] Refresh page, verify preview mode persists
- [ ] Clear localStorage, verify graceful fallback
- [ ] Test with 0, 1, 5, 10+ pending articles
- [ ] Test on mobile viewport

---

## Migration Path

### Phase 1: Foundation (Week 1)
1. Create `preview-mode-context.tsx`
2. Create `preview-articles.ts` utility
3. Add unit tests
4. Deploy as hidden feature (flag-gated)

### Phase 2: UI Integration (Week 2)
1. Add toggle button to admin layout
2. Update homepage to merge articles
3. Update article list UI with draft badges
4. Manual testing

### Phase 3: Detail Pages (Week 3)
1. Update article detail page
2. Add draft banner component
3. Handle image previews
4. Error handling

### Phase 4: Polish & Launch (Week 4)
1. Performance optimization
2. Accessibility audit
3. User documentation
4. Remove feature flag
5. Announce to users

---

## Future Enhancements

### Post-MVP Ideas

1. **Draft-Only View**
   - Filter to show ONLY draft articles
   - Useful when reviewing multiple drafts

2. **Preview Link Sharing**
   - Generate temporary preview link
   - Share with non-admin for feedback
   - Expires after 24 hours

3. **Version Comparison**
   - If editing published article
   - Show diff between published and pending version

4. **Scheduled Publishing**
   - Set publish date/time for draft
   - Auto-publish when date reached

5. **Draft Comments**
   - Add notes/comments to drafts
   - Stored in localStorage
   - Visible only to admin

6. **Preview History**
   - Track when draft was created/modified
   - Show revision history

---

## Summary

This preview mode system provides a non-invasive way to preview pending articles before publishing, without modifying the core publishing flow or GitHub storage. It leverages existing localStorage infrastructure and React context patterns already in use in the codebase.

**Key Benefits**:
- ✅ Zero impact on published articles
- ✅ No GitHub API changes needed
- ✅ Works entirely client-side
- ✅ Seamless integration with existing admin panel
- ✅ Clear visual distinction between drafts and published
- ✅ Optional feature (can be toggled off)
- ✅ Foundation for future enhancements
