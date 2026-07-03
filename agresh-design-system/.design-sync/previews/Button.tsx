import { Button } from 'agresh-design-system'

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-zinc-950 p-8">
      <Button variant="primary">View Projects</Button>
      <Button variant="secondary">Get in Touch</Button>
      <Button variant="link">Read the case study</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-zinc-950 p-8">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-zinc-950 p-8">
      <Button variant="primary" disabled>
        Submitting…
      </Button>
      <Button variant="secondary" disabled>
        Unavailable
      </Button>
    </div>
  )
}
