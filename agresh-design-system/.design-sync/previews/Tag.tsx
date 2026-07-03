import { Tag } from 'agresh-design-system'

export function FilterRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-zinc-950 p-8">
      <Tag active>All</Tag>
      <Tag>Robotics</Tag>
      <Tag>Web</Tag>
      <Tag>Leadership</Tag>
    </div>
  )
}
