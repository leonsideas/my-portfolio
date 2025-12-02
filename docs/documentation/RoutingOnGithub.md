# Routing Architecture Docs

This project uses **VitePress + Vue** but behaves like a small SPA portfolio:

* `/` → landing page with **WorkStack** (list of works)
* `/about/` → static about page
* `/works/?id=some-slug` → **WorkPage** (work detail with sidebar)

Routing has 3 main layers:

1. **VitePress site config** (base + top-level pages)
2. **Link generation** (NavBar + WorkStack)
3. **Work selection logic** (WorkPage sidebar + query string)

---

## 1. VitePress base + top-level routes

In `config.ts`:

```ts
const isProd = process.env.NODE_ENV === 'production'
const repoName = 'my-awsome-portfolio'

export default defineConfig({
  base: isProd ? `/${repoName}/` : '/',
  themeConfig: {
    nav: [
      { text: 'Home',  link: '/' },
      { text: 'about', link: '/about/' },
      { text: 'works', link: '/works/' }
    ]
  }
})
```

* In **dev**: site lives at `/`
* On **GitHub Pages**: site lives at `/<repoName>/`

All links in config are written as if the site lives at `/`.
VitePress then uses `base` to adjust them.

### NavBar links

In `NavBar.vue`:

```vue
import { useData, withBase } from 'vitepress'

const { theme } = useData()
const nav = theme.value.nav || []
```

```vue
<a
  v-for="item in nav"
  :key="item.link"
  :href="withBase(item.link)"
>
  {{ item.text }}
</a>
```

* `item.link` is `/`, `/about/`, `/works/`
* `withBase()` turns this into:

  * dev: `/works/`
  * GitHub Pages: `/my-awsome-portfolio/works/`

So you never hardcode the repo name into links.

---

## 2. How works are discovered and linked

Both **WorkStack.vue** and **WorkPage.vue** discover works automatically from Markdown files in `works/**/index.md`.

### Detection from the filesystem

In both components:

```ts
const markdownFiles = import.meta.glob('../../../works/**/index.md', {
  as: 'raw',
  eager: true
})

const imageFiles = import.meta.glob('../../../works/**/cover.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
})
```

For each `index.md`:

```ts
// docs/works/my-work/index.md -> slug = "my-work"
const match = path.match(/works\/([^/]+)\/index\.md$/)
const slug = match?.[1] ?? ''
```

Then a **work URL** is built as:

```ts
const route = `/works/?id=${slug}`
```

So each work has a URL like:

* `/works/?id=my-work`
* `/works/?id=another-project`

**Important:** these `route`s are **base-less**, meaning they start with `/works/...`.
We always apply `withBase()` when rendering them.

---

## 3. WorkStack: list of works → detail page

`WorkStack.vue` is the “grid/list” on the home page.

For each work, it creates a card:

```vue
<a
  v-for="card in cards"
  :key="card.slug"
  :href="withBase(card.route)"  <!-- /works/?id=slug with base added -->
>
  <!-- Cover + text -->
</a>
```

* Clicking a card sends you to `/works/?id=<slug>` (with base in production).
* This loads the `/works/` route where **WorkPage** is rendered.

---

## 4. Layout: deciding which page component to render

In `Layout.vue`:

```ts
const currentPageComponent = computed(() => {
  if (frontmatter.value.layout === 'home') return WorkStack
  if (route.path.startsWith('/works/')) return WorkPage
  if (route.path.startsWith('/about')) return AboutPage
  return null
})
```

* If a page has `layout: home` in its frontmatter, it renders **WorkStack**.
* If the URL path starts with `/works/`, it renders **WorkPage**.
* `/about/` uses **AboutPage**.
* Anything else falls back to default `<Content />`.

So `/works/?id=slug` → `route.path === '/works/'` → `WorkPage`.

---

## 5. WorkPage: URL → selected work

`WorkPage.vue` is responsible for:

* reading the current selected work from the URL (via `?id=slug`)
* rendering the sidebar list of works
* updating both the UI **and** URL when you click on different works in the sidebar

### Building the cards

Same discovery as in WorkStack, but with an extra `component`:

```ts
const markdownModules = import.meta.glob('../../../works/**/index.md', {
  eager: true
})

cards.value.push({
  slug,
  title,
  name,
  excerpt,
  route: `/works/?id=${slug}`,
  image,
  component: mod?.default || null  // Vue component compiled from markdown
})
```

### Selecting the initial work from the URL

```ts
const currentSlug = ref<string | undefined>(cards.value[0]?.slug)

function getSlugFromLocation(): string | undefined {
  if (typeof window === 'undefined') {
    return cards.value[0]?.slug
  }

  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  return id || cards.value[0]?.slug
}

onMounted(() => {
  currentSlug.value = getSlugFromLocation()
})
```

* When you arrive at `/works/?id=my-work`, the query string is parsed.
* `currentSlug` is set to `my-work`.
* If no `id` is provided, it falls back to the **first** work.

### Computing the currently displayed card

```ts
const currentCard = computed(() =>
  cards.value.find(card => card.slug === currentSlug.value)
)
```

`currentCard` is then rendered in the main content area:

```vue
<component
  v-if="currentCard.component"
  :is="currentCard.component"
  class="prose prose-base md:prose-lg max-w-none"
/>
```

So the selected work’s Markdown becomes the visible content.

---

## 6. Sidebar inside WorkPage: SPA-like navigation

To make the sidebar reactive **without needing a refresh**, we:

1. Render each work as a link.
2. Prevent full page reload using `@click.prevent`.
3. Update `currentSlug` (the reactive selection).
4. Update the URL using VitePress `router.go`.

```ts
import { withBase, useRouter } from 'vitepress'

const router = useRouter()

function selectCard(slug: string, routePath: string) {
  currentSlug.value = slug
  router.go(withBase(routePath))   // updates URL but stays in SPA mode
}
```

In the template:

```vue
<li
  v-for="card in cards"
  :key="card.slug"
  :class="{ 'ring-2 ring-gray-700': card.slug === currentSlug }"
>
  <a
    :href="withBase(card.route)"
    @click.prevent="selectCard(card.slug, card.route)"
    class="flex items-center gap-3 p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
  >
    <!-- thumbnail + title + name -->
  </a>
</li>
```

Result:

* Click **from WorkStack** → URL `/works/?id=foo` → `currentSlug = 'foo'`
* Click **another work in the sidebar**:

  * `currentSlug` changes → UI updates instantly (no refresh)
  * `router.go()` updates the URL to `/works/?id=bar`
* You can still copy/paste URLs and use browser back/forward.

---

## 7. Summary in plain words

* **All internal routes are written without the GitHub Pages base** (`/`, `/about/`, `/works/`, `/works/?id=slug`).
* GitHub Pages base (`/my-awsome-portfolio/`) is applied automatically via:

  * `base` in `config.ts`
  * `withBase()` when rendering `<a href>`.
* **WorkStack**: generates links to `/works/?id=slug` for each work.
* **Layout**: sees `/works/...` and mounts **WorkPage**.
* **WorkPage**:

  * On mount, reads `?id=slug` to pick which work to show.
  * Sidebar clicks update both the **reactive state** (`currentSlug`) and the **URL** (via `router.go`), so no page refresh is needed.

If you want, I can turn this into a Markdown doc ready to drop into `docs/routing.md` in your project.
