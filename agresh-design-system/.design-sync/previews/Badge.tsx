import { Badge } from 'agresh-design-system'

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-950 p-8">
      <Badge variant="small">Robotics</Badge>
      <Badge variant="large">Founder</Badge>
      <Badge variant="accent">Live</Badge>
    </div>
  )
}
