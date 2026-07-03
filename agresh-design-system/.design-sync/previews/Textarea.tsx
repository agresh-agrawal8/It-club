import { Textarea } from 'agresh-design-system'

export function Default() {
  return (
    <div className="max-w-sm bg-zinc-950 p-8">
      <label className="mb-2 block text-xs uppercase tracking-widest text-zinc-500">Message</label>
      <Textarea placeholder="Tell me about your project…" />
    </div>
  )
}
