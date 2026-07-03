import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar isAuthed={!!current} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
