import { Input } from 'agresh-design-system'

export function Default() {
  return (
    <div className="max-w-sm bg-zinc-950 p-8">
      <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">Name</label>
      <Input placeholder="Jane Doe" />
    </div>
  )
}

export function Focused() {
  return (
    <div className="max-w-sm bg-zinc-950 p-8">
      <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">Email</label>
      <Input placeholder="jane@example.com" autoFocus defaultValue="jane@example.com" />
    </div>
  )
}
