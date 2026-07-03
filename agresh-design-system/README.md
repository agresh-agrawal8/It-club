# agresh-design-system

Core UI kit distilled from [agreshagrawal.com](https://agreshagrawal.com) — a sophisticated, luxury dark theme with violet accents. See `DESIGN_SYSTEM.md` in the portfolio repo for the full brand guidelines this library implements.

## Components

- `Button` — `primary` / `secondary` / `link` variants, `sm` / `md` / `lg` sizes
- `Card` — bordered zinc surface, optional `hoverLift`
- `Badge` — `small` / `large` / `accent` variants
- `Tag` — pill-shaped filter/category tag with `active` state
- `Input` / `Textarea` — underline-style form fields
- `SectionHeading` — eyebrow + title + description, `left` / `center` alignment
- `Divider` — `thin` / `thick` horizontal rules

## Usage

```tsx
import { Button, Card, SectionHeading } from 'agresh-design-system'
import 'agresh-design-system/styles.css'

function Example() {
  return (
    <Card hoverLift>
      <SectionHeading eyebrow="Ventures" title="MunifyX" description="Robotics innovation." />
      <Button variant="primary">View project</Button>
    </Card>
  )
}
```

## Development

```bash
npm install
npm run build
```
