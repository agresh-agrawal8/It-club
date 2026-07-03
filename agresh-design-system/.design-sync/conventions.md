## Setup

No provider or theme wrapper is required — the dark palette is baked directly into each component's classes, not driven by a runtime theme. The only required step is importing the compiled stylesheet once, at the app root:

```tsx
import 'agresh-design-system/styles.css'
```

That file is pre-compiled Tailwind CSS (the host app does not need Tailwind configured itself — the classes are already generated).

## Styling idiom

Components ship pre-styled with fixed Tailwind utility classes implementing a dark, luxury aesthetic — you extend appearance via each component's `className` prop, not via theme tokens or CSS variables (there are none). Passed classes are merged with `tailwind-merge` internally, so conflicting utilities you pass safely override the component's defaults instead of duplicating.

Real vocabulary used throughout the kit:

| Purpose | Classes |
|---|---|
| Backgrounds | `bg-zinc-950` (page), `bg-zinc-900` (cards/surfaces), `bg-white` (primary CTA) |
| Text | `text-white` (primary), `text-zinc-300` (body/secondary), `text-zinc-400`/`text-zinc-500` (metadata) |
| Accent | `text-violet-400` / `border-violet-400` (highlights, focus), `bg-amber-200` (button hover) |
| Borders | `border-white/10`, `border-white/20`, `border-zinc-700`, `border-zinc-800` |
| Radius | `rounded-2xl` (buttons), `rounded-3xl` (cards), `rounded-full` (badges/tags) |
| Type | `tracking-tighter` (headings), `tracking-tight` (body), `tracking-wide` (labels), `tracking-[2px]` (eyebrows) |

Don't introduce a different color family (e.g. `blue-*`, `slate-*`) for new composition — stay within zinc/violet/amber to match the rest of the site.

## Where the truth lives

- `styles.css` / `_ds_bundle.css` (bound copies of `dist/agresh-design-system.css`) — the actual compiled CSS; grep it before trusting a class name that isn't in the table above.
- Each component's `<Name>.d.ts` — the exact prop API (variant/size unions, native HTML attribute passthrough).
- Each component's `.prompt.md` — usage guidance and props.

## Example composition

```tsx
import { Card, SectionHeading, Badge, Button } from 'agresh-design-system'

function ProjectCard() {
  return (
    <Card hoverLift className="max-w-sm">
      <Badge variant="accent" className="mb-4 w-fit">Featured</Badge>
      <SectionHeading eyebrow="Ventures" title="MunifyX" description="Robotics innovation." />
      <Button variant="primary" className="mt-6">View project</Button>
    </Card>
  )
}
```
