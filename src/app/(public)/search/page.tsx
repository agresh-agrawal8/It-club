import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { GlobalSearch } from "@/components/features/global-search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across projects, members, events, competitions and achievements.",
};

export default function SearchPage() {
  return (
    <>
      <PageHeader eyebrow="Find anything" title="Search" />
      <Container className="py-16">
        <div className="mx-auto max-w-3xl">
          <GlobalSearch />
        </div>
      </Container>
    </>
  );
}
