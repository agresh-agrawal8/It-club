import { SectionHeading } from 'agresh-design-system'

export function LeftAligned() {
  return (
    <div className="bg-zinc-950 p-8">
      <SectionHeading
        eyebrow="Ventures"
        title="Projects & Products"
        description="A selection of ventures I've founded and products I've shipped."
      />
    </div>
  )
}

export function Centered() {
  return (
    <div className="bg-zinc-950 p-8">
      <SectionHeading
        align="center"
        eyebrow="About"
        title="Founder, Developer, Innovator"
        description="Real product builder creating scalable systems and impactful technology."
      />
    </div>
  )
}

export function TitleOnly() {
  return (
    <div className="bg-zinc-950 p-8">
      <SectionHeading title="Leadership & Execution" />
    </div>
  )
}
