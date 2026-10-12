import { siteConfig } from "@/lib/site";
import { ContactForm } from "@/components/marketing/contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
        <p className="mt-2 text-muted-foreground">
          Questions about courses, fees or registration? Send a message and we&apos;ll get back to you.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
              <CardDescription>We typically reply within one working day.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visit the centre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                {siteConfig.address}
              </p>
              <p className="flex items-center gap-2">
                <PhoneIcon className="size-4 shrink-0 text-primary" />
                <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                  {siteConfig.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MailIcon className="size-4 shrink-0 text-primary" />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-foreground">
                  {siteConfig.email}
                </a>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">WhatsApp</CardTitle>
              <CardDescription>Fastest for quick questions.</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <MessageCircleIcon className="size-4" /> Chat on WhatsApp
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
