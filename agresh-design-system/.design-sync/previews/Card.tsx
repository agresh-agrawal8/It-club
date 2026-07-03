import { Card, Badge, Button } from 'agresh-design-system'

export function Default() {
  return (
    <div className="bg-zinc-950 p-8">
      <Card className="max-w-sm">
        <span className="text-xs font-mono tracking-widest text-zinc-500">MunifyX</span>
        <h3 className="mt-2 text-2xl font-semibold text-white">Robotics Innovation</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Building autonomous systems that combine hardware and software into products people
          actually use.
        </p>
      </Card>
    </div>
  )
}

export function HoverLift() {
  return (
    <div className="bg-zinc-950 p-8">
      <Card hoverLift className="max-w-sm">
        <Badge variant="accent" className="mb-4 w-fit">
          Featured
        </Badge>
        <h3 className="text-2xl font-semibold text-white">Alfa Motors</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          A ground-up EV platform, from chassis design to the software stack.
        </p>
        <Button variant="link" className="mt-4">
          View project →
        </Button>
      </Card>
    </div>
  )
}
