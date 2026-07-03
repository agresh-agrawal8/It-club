import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/features/contact-form";
import { SubscribeForm } from "@/components/features/subscribe-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the EHIS IT Club core team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Say hello"
        title="Contact the club"
        description="Questions, collaborations or just curious? Send us a message."
      />
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <Card glass>
          <ContactForm />
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex items-start gap-4 p-6">
            <Mail className="mt-0.5 h-5 w-5 text-brand-300" />
            <div>
              <h3 className="text-sm font-semibold text-white">Email</h3>
              <a href="mailto:agresh@agreshagrawal.com" className="text-sm text-zinc-400 hover:text-white">
                agresh@agreshagrawal.com
              </a>
            </div>
          </Card>
          <Card className="flex items-start gap-4 p-6">
            <MapPin className="mt-0.5 h-5 w-5 text-brand-300" />
            <div>
              <h3 className="text-sm font-semibold text-white">Find us</h3>
              <p className="text-sm text-zinc-400">Emerald Heights International School, Indore</p>
            </div>
          </Card>
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-brand-300" />
              <h3 className="text-sm font-semibold text-white">Get notified</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Subscribe for email updates on new events and competitions.
            </p>
            <SubscribeForm />
          </Card>
        </div>
      </Container>
    </>
  );
}
