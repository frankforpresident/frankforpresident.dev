# frankforpresident.dev

My personal site: one page, built with [Astro](https://astro.build) and deployed
on Cloudflare Pages. The live site is <https://frankforpresident.dev>.

No CMS, no analytics, no tracking. Static HTML and one small script that turns
the hero into a working terminal.

## Layout

| Path | Purpose |
|---|---|
| `src/data/site.ts` | All copy: bio, work, stack, links |
| `src/data/commands.ts` | Command registry, shared by the terminal and the palette |
| `src/scripts/main.ts` | Theme, terminal, command palette |
| `src/styles/global.css` | Design tokens and every rule on the page |
| `src/components/` | `Terminal`, `Palette`, `Icon` |
| `src/layouts/Base.astro` | Head, meta, `Person` structured data |
| `public/_headers` | CSP, cache and security headers for Cloudflare Pages |
| `design/og.svg` | Source for the social card, rendered to `public/og.png` |

## Editing the site

Text changes need no template work: everything lives in `src/data/site.ts`.

```bash
npm install
npm run dev
```

Then open <http://localhost:4321>.

Regenerate the social card after editing `design/og.svg`:

```bash
rsvg-convert -w 1200 -h 630 design/og.svg -o public/og.png
```

## The terminal

The hero contains a real prompt with tab completion, command history and a
`Ctrl+K` command palette over the same registry. It is an accelerator, never
the only path: every command scrolls to a section that is already in the HTML,
and without JavaScript the prompt degrades to a static block with working
links.

Adding a command means adding one entry to `commands` in
`src/data/commands.ts`. The palette and `help` pick it up automatically.

## Verifying a change

```bash
npm run check      # astro check, must be clean
npm run build      # must succeed without warnings
```
