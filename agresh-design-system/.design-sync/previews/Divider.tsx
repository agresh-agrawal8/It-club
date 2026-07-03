import { Divider } from 'agresh-design-system'

export function Thin() {
  return (
    <div className="bg-zinc-950 p-8">
      <p className="pb-6 text-sm text-zinc-400">Section content above</p>
      <Divider />
      <p className="pt-6 text-sm text-zinc-400">Section content below</p>
    </div>
  )
}

export function Thick() {
  return (
    <div className="bg-zinc-950 p-8">
      <p className="pb-6 text-sm text-zinc-400">Previous section</p>
      <Divider thickness="thick" />
      <p className="pt-6 text-sm text-zinc-400">Next major section</p>
    </div>
  )
}
