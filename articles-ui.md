# Article UI Improvements - Detailed Analysis & Implementation Plan

## 📊 Current State vs Portfolio Reference Comparison

### **Executive Summary**
The Portfolio reference site has significantly better control over article rendering through custom CSS classes, while cosecase relies heavily on Tailwind prose utilities, limiting styling flexibility and causing several UX issues.

---

## 🔍 Key Differences Analysis

### **1. Markdown Processing Pipeline**

#### **Portfolio (Reference) - Using Unified + Rehype**
```typescript
// reference/portfolio/lib/markdown.ts:129-142
export async function markdownToHtml(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)           // Parse markdown
    .use(remarkGfm)              // GitHub Flavored Markdown
    .use(remarkRehype, { allowDangerousHtml: true })  // Markdown → HTML AST
    .use(rehypeHighlight, {      // Syntax highlighting for code blocks
      detect: false,
      subset: ['swift', 'javascript', 'typescript', 'css', 'html', 'bash', 'json']
    })
    .use(rehypeStringify, { allowDangerousHtml: true })  // HTML AST → String
    .process(content)

  return result.toString()
}
```

**Benefits:**
- ✅ Full HTML AST transformation pipeline
- ✅ Built-in syntax highlighting with `rehype-highlight`
- ✅ Code block language detection
- ✅ More control over HTML output

#### **cosecase (Current) - Using Remark + Manual Sanitization**
```typescript
// lib/markdown-parser.ts:40-78
const processedContent = await remark()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkHtml, { sanitize: false })
  .process(contentWithResolvedImages)

const rawHtml = String(processedContent)

const htmlContent = sanitizeHtml(rawHtml, {
  allowedTags: [...],
  allowedAttributes: {...}
})
```

**Issues:**
- ❌ No syntax highlighting for code blocks
- ❌ Manual HTML sanitization (extra step)
- ❌ Less flexible transformation pipeline
- ❌ No code language detection

---

### **2. Title Duplication Problem**

#### **Portfolio Approach (Correct)**
```typescript
// reference/portfolio/app/insights/[slug]/page.tsx:96
<Title as="h1">{article.title}</Title>

// Then later, article content is rendered WITHOUT the title
<div className="article-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
```

**How it works:**
1. Title extracted from frontmatter
2. Displayed once in the header
3. Markdown content **does NOT** include `# Title` heading
4. Article files contain frontmatter + content without title

**Example Portfolio Article Structure:**
```markdown
---
title: My Article Title
date: 2024-01-15
description: Article description
---

This is the first paragraph (NO # Title heading here!)

## First Section
Content...
```

#### **cosecase Current Approach (Wrong)**
```typescript
// app/[slug]/page.tsx:33
<ArticleHeader title={post.metadata.title} />  // Title shown here

// Then content includes the title AGAIN
<ArticleContent content={post.content} />  // <h1>Title</h1> inside content
```

**The Problem:**
Markdown files likely contain:
```markdown
---
title: Pitti Fragranze 2025
---

# Pitti Fragranze 2025  ← THIS CREATES DUPLICATION!

Content here...
```

**Solution:**
Remove the `# Title` line from markdown files, keep only frontmatter title.

---

### **3. Styling Control Comparison**

#### **Portfolio - Full Custom CSS Control (110+ lines)**
```css
/* reference/portfolio/app/globals.css:522-631 */

/* Article content styling */
.article-content h1 {
  @apply text-3xl font-black text-brand-black mb-6 mt-8;
}

.article-content h2 {
  @apply text-2xl font-bold text-brand-black mb-4 mt-6;
}

.article-content h3 {
  @apply text-xl font-bold text-brand-black mb-3 mt-5;
}

.article-content h4 {
  @apply text-lg font-bold text-brand-black mb-2 mt-4;
}

.article-content h5 {
  @apply text-base font-bold text-brand-black mb-2 mt-3;
}

.article-content h6 {
  @apply text-sm font-bold text-brand-black mb-1 mt-2;
}

.article-content p {
  @apply mb-4 text-gray-700 leading-relaxed;
}

.article-content ul,
.article-content ol {
  @apply mb-4 pl-6;
}

.article-content li {
  @apply mb-2;
}

/* Inline code styling */
.article-content code:not(pre code) {
  @apply px-2 py-1 rounded text-sm;
  background-color: var(--yellow);
  color: #000;
}

/* Code block styling with syntax highlighting */
.article-content pre {
  @apply rounded-xl my-6 overflow-x-auto;
  padding: 1.5rem;
  background: #0d1117 !important;
}

.article-content pre code {
  @apply text-sm;
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-size: 14px;
  line-height: 1.6;
}

/* Syntax highlighting overrides */
.article-content .hljs-keyword {
  color: #ff79c6 !important; /* Pink for keywords */
}

.article-content .hljs-built_in {
  color: #8be9fd !important; /* Cyan for built-in types */
}

.article-content .hljs-string {
  color: #f1fa8c !important; /* Yellow for strings */
}

.article-content blockquote {
  @apply border-l-4 border-pink-300 pl-4 italic my-6 text-gray-600;
  border-color: var(--pink);
}

.article-content strong {
  @apply font-bold;
}

.article-content em {
  @apply italic;
}

.article-content a {
  @apply text-brand-black font-bold underline hover:opacity-80 transition-opacity;
}
```

**Why this is superior:**
- ✅ Complete control over every element
- ✅ Custom spacing (mb-4, mt-6, my-6, etc.)
- ✅ Brand-consistent colors
- ✅ Syntax highlighting color scheme
- ✅ Easy to modify all articles at once
- ✅ Scoped to `.article-content` - doesn't affect other content

#### **cosecase - Limited Tailwind Prose (16 lines)**
```tsx
// components/article-content.tsx:8-23
<div
  className="prose prose-lg max-w-none
    prose-headings:font-serif prose-headings:text-foreground
    prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
    prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8
    prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
    prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
    prose-strong:text-foreground prose-strong:font-semibold
    prose-em:text-foreground prose-em:italic
    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground
    prose-ul:text-foreground prose-ol:text-foreground
    prose-li:text-foreground prose-li:mb-1
    prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
    prose-hr:border-border prose-hr:my-8
    prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
    prose-pre:bg-muted prose-pre:border prose-pre:border-border"
  dangerouslySetInnerHTML={{ __html: content }}
/>
```

**Why this is limiting:**
- ❌ Long, unreadable className
- ❌ Hard to maintain/modify
- ❌ No syntax highlighting colors
- ❌ Limited customization options
- ❌ Can't easily add new styles
- ❌ Harder to debug styling issues

---

### **4. Syntax Highlighting**

#### **Portfolio Has Full Syntax Highlighting**
```css
/* reference/portfolio/app/globals.css:3 */
@import "highlight.js/styles/github-dark.css";

/* Custom overrides */
.article-content .hljs-keyword { color: #ff79c6 !important; }
.article-content .hljs-built_in { color: #8be9fd !important; }
.article-content .hljs-string { color: #f1fa8c !important; }
.article-content .hljs-number { color: #bd93f9 !important; }
.article-content .hljs-comment { color: #6272a4 !important; }
.article-content .hljs-title { color: #50fa7b !important; }
```

**Result:** Beautiful code blocks with language-specific coloring

#### **cosecase Has No Syntax Highlighting**
- ❌ Code blocks are plain text
- ❌ No language detection
- ❌ No color scheme
- ❌ Poor readability for technical content

---

### **5. Spacing & Typography Issues**

#### **Portfolio - Precise Control**
```css
.article-content h1 { mb-6 mt-8 }   /* 1.5rem bottom, 2rem top */
.article-content h2 { mb-4 mt-6 }   /* 1rem bottom, 1.5rem top */
.article-content h3 { mb-3 mt-5 }
.article-content p { mb-4 }          /* 1rem bottom margin */
.article-content pre { my-6 }        /* 1.5rem vertical spacing */
.article-content blockquote { my-6 }
```

**Result:** Perfect vertical rhythm, content breathes naturally

#### **cosecase - Inconsistent**
```tsx
prose-h1:mb-6 prose-h1:mt-8  /* Only h1 has spacing */
prose-h2:mb-4 prose-h2:mt-8  /* h2 has spacing */
prose-p:mb-4                  /* Paragraphs have spacing */
/* But ul, ol, blockquote, pre don't have explicit spacing */
```

**Result:** Everything looks squashed together, poor reading experience

---

## 🎯 Implementation Plan

### **Phase 1: Fix Title Duplication**

#### **Step 1.1: Update Markdown Files**
Remove `# Title` from all markdown files, keep only frontmatter:

**Before:**
```markdown
---
title: Pitti Fragranze 2025
date: 2025-10-02
tags: profumi
---

# Pitti Fragranze 2025

Content here...
```

**After:**
```markdown
---
title: Pitti Fragranze 2025
date: 2025-10-02
tags: profumi
---

Content here without title heading...
```

#### **Step 1.2: Verify Header Display**
Current implementation in `app/[slug]/page.tsx:33` already shows title correctly:
```tsx
<ArticleHeader title={post.metadata.title} image={post.metadata.image} />
```

**No code changes needed** - just update markdown files.

---

### **Phase 2: Migrate to Unified + Rehype Pipeline**

#### **Step 2.1: Install Required Packages**
```bash
npm install unified remark-rehype rehype-highlight rehype-stringify highlight.js
```

#### **Step 2.2: Update `lib/markdown-parser.ts`**

**Replace lines 40-78 with:**
```typescript
import { unified } from 'unified'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'

// ... existing imports ...

export async function parseMarkdown(markdownText: string, slug: string): Promise<ParsedMarkdown> {
  const { data, content } = matter(markdownText)

  // Extract tags
  const tagsRaw = data.tags || ""
  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
    : Array.isArray(tagsRaw)
    ? tagsRaw
    : []

  // Replace relative image paths
  const contentWithResolvedImages = resolveImagePaths(content, slug)

  // Convert Markdown to HTML using unified pipeline
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)  // GitHub Flavored Markdown (tables, strikethrough, etc.)
    .use(remarkRehype, { allowDangerousHtml: false })  // Markdown → HTML AST
    .use(rehypeHighlight, {  // Add syntax highlighting
      detect: false,
      subset: ['javascript', 'typescript', 'css', 'html', 'bash', 'json', 'python', 'java']
    })
    .use(rehypeStringify, { allowDangerousHtml: false })  // HTML AST → String
    .process(contentWithResolvedImages)

  const htmlContent = String(processedContent)

  // No need for sanitizeHtml anymore - rehype handles it

  return {
    frontmatter: {
      title: data.title || "Untitled",
      date: data.date || new Date().toISOString().split("T")[0],
      description: data.description || "",
      tags,
    },
    htmlContent,
    rawContent: content,
  }
}
```

**Key changes:**
- ✅ Use `unified()` instead of `remark()`
- ✅ Use `remarkRehype` for AST transformation
- ✅ Add `rehypeHighlight` for syntax highlighting
- ✅ Remove manual `sanitizeHtml` (rehype handles it)
- ✅ Set `allowDangerousHtml: false` for security

---

### **Phase 3: Add Custom Article CSS**

#### **Step 3.1: Add to `app/globals.css` (after line 196)**

```css
/* ============================================
   ARTICLE CONTENT STYLING
   ============================================ */

/* Import syntax highlighting theme */
@import "highlight.js/styles/github-dark.css";

/* Article content wrapper - adapts to cosecase's brand colors */
.article-content {
  @apply text-foreground;
}

/* Headings - Use brand primary color for visual hierarchy */
.article-content h1 {
  @apply text-3xl font-bold text-brand-primary mb-6 mt-8;
  line-height: 1.2;
}

.article-content h2 {
  @apply text-2xl font-bold text-brand-primary mb-4 mt-6;
  line-height: 1.3;
}

.article-content h3 {
  @apply text-xl font-semibold text-brand-primary mb-3 mt-5;
  line-height: 1.4;
}

.article-content h4 {
  @apply text-lg font-semibold text-brand-primary mb-2 mt-4;
  line-height: 1.4;
}

.article-content h5 {
  @apply text-base font-semibold text-brand-primary mb-2 mt-3;
  line-height: 1.5;
}

.article-content h6 {
  @apply text-sm font-semibold text-brand-primary mb-1 mt-2;
  line-height: 1.5;
}

/* Paragraphs - Generous spacing for readability */
.article-content p {
  @apply mb-4 text-foreground leading-relaxed;
  font-size: 1.0625rem; /* 17px - optimal reading size */
}

/* Lists - Proper indentation and spacing */
.article-content ul,
.article-content ol {
  @apply mb-4 pl-6;
}

.article-content ul {
  list-style-type: disc;
}

.article-content ol {
  list-style-type: decimal;
}

.article-content li {
  @apply mb-2 text-foreground leading-relaxed;
}

.article-content li p {
  @apply mb-2; /* Reduce paragraph margin inside list items */
}

/* Nested lists */
.article-content ul ul,
.article-content ol ul,
.article-content ul ol,
.article-content ol ol {
  @apply mt-2 mb-2;
}

/* Links - Use primary brand color with subtle hover effect */
.article-content a {
  @apply text-brand-primary font-medium underline underline-offset-4 transition-opacity;
  text-decoration-thickness: 1px;
}

.article-content a:hover {
  @apply opacity-80;
  text-decoration-thickness: 2px;
}

/* Inline code - Highlight with muted background */
.article-content code:not(pre code) {
  @apply px-2 py-1 rounded text-sm font-mono;
  background-color: var(--muted);
  color: var(--brand-primary);
  border: 1px solid var(--border);
}

/* Code blocks - Dark theme with syntax highlighting */
.article-content pre {
  @apply rounded-lg my-6 overflow-x-auto;
  padding: 1.5rem;
  background: #0d1117 !important; /* GitHub Dark background */
  border: 1px solid var(--border);
}

.article-content pre code {
  @apply text-sm font-mono;
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  color: #c9d1d9; /* GitHub Dark text color */
  font-size: 14px;
  line-height: 1.6;
}

/* Syntax highlighting color overrides - Adapted to cosecase vibe */
.article-content .hljs-keyword {
  color: #ff79c6 !important; /* Pink for keywords (let, const, function) */
}

.article-content .hljs-built_in {
  color: #8be9fd !important; /* Cyan for built-in functions */
}

.article-content .hljs-string {
  color: #f1fa8c !important; /* Yellow for strings */
}

.article-content .hljs-number {
  color: #bd93f9 !important; /* Purple for numbers */
}

.article-content .hljs-comment {
  color: #6272a4 !important; /* Gray for comments */
  font-style: italic;
}

.article-content .hljs-title {
  color: #50fa7b !important; /* Green for function/class names */
}

.article-content .hljs-type {
  color: #8be9fd !important; /* Cyan for types */
}

.article-content .hljs-literal {
  color: #bd93f9 !important; /* Purple for true/false/null */
}

.article-content .hljs-attr {
  color: #50fa7b !important; /* Green for attributes */
}

.article-content .hljs-variable {
  color: #f8f8f2 !important; /* White for variables */
}

/* Blockquotes - Elegant with brand primary accent */
.article-content blockquote {
  @apply border-l-4 pl-6 italic my-6 text-muted-foreground;
  border-color: var(--brand-primary);
  background: color-mix(in srgb, var(--muted) 50%, transparent 50%);
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-radius: 0 0.25rem 0.25rem 0;
}

.article-content blockquote p {
  @apply mb-2;
}

/* Strong/Bold text */
.article-content strong {
  @apply font-bold text-foreground;
}

/* Emphasis/Italic text */
.article-content em {
  @apply italic text-foreground;
}

/* Horizontal rules - Subtle dividers */
.article-content hr {
  @apply my-8 border-border;
}

/* Tables - Clean and readable */
.article-content table {
  @apply w-full my-6 border-collapse;
  border: 1px solid var(--border);
}

.article-content th {
  @apply bg-muted text-foreground font-semibold text-left px-4 py-2;
  border: 1px solid var(--border);
}

.article-content td {
  @apply text-foreground px-4 py-2;
  border: 1px solid var(--border);
}

.article-content tbody tr:nth-child(even) {
  @apply bg-muted/30;
}

/* Images - Responsive with subtle shadow */
.article-content img {
  @apply rounded-lg shadow-md my-8 max-w-full h-auto;
}

/* Strikethrough (from remarkGfm) */
.article-content del {
  @apply text-muted-foreground line-through;
}

/* Task lists (from remarkGfm) */
.article-content input[type="checkbox"] {
  @apply mr-2;
}

/* Figure captions */
.article-content figure {
  @apply my-8;
}

.article-content figcaption {
  @apply text-sm text-muted-foreground text-center mt-2 italic;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .article-content h1 {
    @apply text-2xl mb-4 mt-6;
  }

  .article-content h2 {
    @apply text-xl mb-3 mt-5;
  }

  .article-content h3 {
    @apply text-lg mb-2 mt-4;
  }

  .article-content p {
    font-size: 1rem; /* 16px on mobile */
  }

  .article-content pre {
    padding: 1rem;
    font-size: 13px;
  }

  .article-content pre code {
    font-size: 13px;
  }
}
```

**Design Philosophy:**
- ✅ Uses cosecase's existing CSS variables (`--brand-primary`, `--muted`, `--border`)
- ✅ Maintains Italian elegance with proper spacing
- ✅ Dark code blocks for modern look
- ✅ Mobile-responsive typography
- ✅ Accessible and readable
- ✅ Easy to maintain and modify

---

### **Phase 4: Update ArticleContent Component**

#### **Step 4.1: Simplify `components/article-content.tsx`**

**Replace entire file with:**
```tsx
interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div
      className="article-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
```

**Benefits:**
- ✅ Clean, simple, maintainable
- ✅ All styling controlled by CSS
- ✅ 7 lines instead of 27
- ✅ Easy to understand

---

### **Phase 5: Testing & Verification**

#### **Test Checklist**

**Visual Tests:**
- [ ] Title appears only once (in header, not in content)
- [ ] H1-H6 headings have proper sizing and spacing
- [ ] Paragraphs have good vertical rhythm
- [ ] Lists are properly indented
- [ ] Code blocks have syntax highlighting
- [ ] Inline code has subtle background
- [ ] Links are underlined and use brand color
- [ ] Images are rounded and have shadow
- [ ] Blockquotes have left border accent
- [ ] Tables are clean and readable
- [ ] Mobile responsive (test on phone)

**Functional Tests:**
- [ ] Line breaks render correctly (no squashed text)
- [ ] GFM features work (tables, strikethrough, task lists)
- [ ] Image paths resolve correctly
- [ ] Code language detection works
- [ ] No console errors
- [ ] Build succeeds without warnings

**Content Tests:**
Create test article with:
```markdown
---
title: Test Article
date: 2025-01-15
description: Testing all markdown features
tags: test
---

This is a paragraph with **bold** and *italic* text.

## Heading 2

Another paragraph with [a link](https://example.com).

### Heading 3

- List item 1
- List item 2
  - Nested item

1. Numbered item 1
2. Numbered item 2

`inline code here`

```javascript
function hello() {
  console.log("Hello, world!");
}
```

> This is a blockquote with some wisdom.

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

~~Strikethrough text~~

![Test image](image.jpg)

---

That's all folks!
```

---

## 📦 Required Package Installations

```bash
npm install unified remark-rehype rehype-highlight rehype-stringify highlight.js
```

**Package purposes:**
- `unified` - Core transformation pipeline
- `remark-rehype` - Converts Markdown AST to HTML AST
- `rehype-highlight` - Adds syntax highlighting to code blocks
- `rehype-stringify` - Converts HTML AST to string
- `highlight.js` - Syntax highlighting library + themes

---

## 🎨 Keeping cosecase's Vibe

**Design Principles Applied:**

1. **Italian Elegance**
   - Generous white space
   - Refined typography
   - Subtle shadows and borders

2. **Brand Consistency**
   - Uses `--brand-primary` for headings
   - Uses existing color variables
   - Matches overall site aesthetic

3. **Readability First**
   - 17px base font size (optimal for Italian text)
   - 1.6-1.8 line height
   - Proper heading hierarchy

4. **Modern & Clean**
   - Dark code blocks (contemporary)
   - Rounded corners
   - Smooth transitions

5. **Mobile-Friendly**
   - Responsive typography
   - Touch-friendly spacing
   - Optimized for small screens

---

## 🚀 Deployment Steps

1. **Install packages** (5 minutes)
2. **Update markdown-parser.ts** (10 minutes)
3. **Add CSS to globals.css** (5 minutes)
4. **Simplify article-content.tsx** (2 minutes)
5. **Remove `# Title` from markdown files** (10-15 minutes)
6. **Test on sample articles** (15 minutes)
7. **Deploy and verify** (5 minutes)

**Total estimated time: ~1 hour**

---

## 📝 Post-Implementation Notes

**What this fixes:**
- ✅ Title duplication
- ✅ Squashed content spacing
- ✅ No syntax highlighting
- ✅ Limited styling control
- ✅ Poor typography
- ✅ Inconsistent line breaks

**What stays the same:**
- ✅ Article fetching logic
- ✅ Image handling
- ✅ GitHub integration
- ✅ Security (slug sanitization, path traversal prevention)
- ✅ Frontmatter parsing

**Additional benefits:**
- ✅ More maintainable code
- ✅ Better performance (fewer classes)
- ✅ Easier to customize
- ✅ Professional appearance
- ✅ Better reading experience

---

## 🔧 Troubleshooting

**If titles still appear twice:**
- Check markdown files for `# Title` headings
- Verify frontmatter has title field
- Clear Next.js cache (`rm -rf .next`)

**If syntax highlighting doesn't work:**
- Verify `highlight.js` is installed
- Check CSS import is present
- Ensure code blocks have language tags (```javascript)

**If spacing looks wrong:**
- Check globals.css has article-content styles
- Verify no conflicting prose classes remain
- Inspect element in browser DevTools

**If build fails:**
- Check all imports are correct
- Verify package.json has all dependencies
- Run `npm install` again

---

## 📚 References

- Portfolio reference: `/reference/portfolio/`
- Current implementation: `/lib/markdown-parser.ts`, `/components/article-content.tsx`
- Unified docs: https://unifiedjs.com/
- Rehype Highlight: https://github.com/rehypejs/rehype-highlight
- Highlight.js themes: https://highlightjs.org/static/demo/

---

*This plan maintains cosecase's elegant, Italian-inspired aesthetic while providing the same level of control found in the Portfolio reference site.*
